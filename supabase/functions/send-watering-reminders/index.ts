/**
 * send-watering-reminders
 *
 * Edge Function que cada día:
 *  1. Busca todos los usuarios con plantas que necesitan riego hoy.
 *  2. Para cada uno, busca:
 *      - sus suscripciones VAPID ACTIVAS (disabled_at IS NULL)
 *      - sus tokens Expo
 *  3. Envía una notificación por cada canal.
 *
 * Estrategia de coexistencia web ↔ mobile (ver migration
 * 20260525000000_expo_push_subscriptions.sql):
 *   Cuando el usuario instala la app mobile y registra su Expo token,
 *   la app marca sus suscripciones VAPID como inactivas. Esta función
 *   filtra por disabled_at IS NULL, así que esos usuarios reciben la
 *   notif solo por Expo.
 *
 * Llamada por pg_cron cada día a las 9am UTC. También se puede llamar
 * manualmente con POST para testing.
 *
 * Secrets requeridos (Supabase Dashboard → Edge Functions → Secrets):
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT   (ej: "mailto:tu@email.com")
 *
 * Expo push NO requiere secret: la Expo Push API acepta cualquier
 * llamada con un token válido. Para producción con muchos usuarios,
 * conviene configurar EXPO_ACCESS_TOKEN para mayor rate limit.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "default" | "normal" | "high";
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const vapidPublicKey  = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject    = Deno.env.get("VAPID_SUBJECT") ?? "mailto:musgo@example.com";
    const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
    const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Buscar plantas con sed, agrupadas por usuario.
    const today = new Date().toISOString().split("T")[0]!;
    const { data: plants, error: plantsError } = await supabase
      .from("plants")
      .select("user_id, freq, water_log");

    if (plantsError) throw plantsError;

    const thirstyByUser: Record<string, number> = {};
    for (const plant of plants ?? []) {
      const waterLog: string[] = Array.isArray(plant.water_log) ? plant.water_log : [];
      const lastWatered = waterLog.length > 0 ? [...waterLog].sort().reverse()[0] : null;

      let needsWater = true;
      if (lastWatered) {
        const last = new Date(lastWatered);
        const now  = new Date(today);
        last.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const days = Math.floor((now.getTime() - last.getTime()) / 86400000);
        needsWater = days >= Number(plant.freq);
      }

      if (needsWater) {
        thirstyByUser[plant.user_id] = (thirstyByUser[plant.user_id] ?? 0) + 1;
      }
    }

    const userIds = Object.keys(thirstyByUser);
    if (userIds.length === 0) {
      return jsonResponse({ sent: 0, message: "No thirsty plants today" });
    }

    // 2. Mandar VAPID y Expo en paralelo.
    const [vapidStats, expoStats] = await Promise.all([
      sendVapidNotifications(supabase, userIds, thirstyByUser, {
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject,
      }),
      sendExpoNotifications(supabase, userIds, thirstyByUser, expoAccessToken),
    ]);

    return jsonResponse({
      usersWithThirsty: userIds.length,
      vapid: vapidStats,
      expo: expoStats,
    });
  } catch (err) {
    console.error("send-watering-reminders error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface VapidConfig {
  vapidPublicKey: string | undefined;
  vapidPrivateKey: string | undefined;
  vapidSubject: string;
}

/**
 * Envía notifs VAPID a las suscripciones ACTIVAS de los usuarios.
 * "Activas" = disabled_at IS NULL. Las desactivadas se ignoran (es lo que
 * pasa cuando el usuario migró a mobile).
 */
async function sendVapidNotifications(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
  thirstyByUser: Record<string, number>,
  config: VapidConfig,
): Promise<{ sent: number; failed: number; skipped: number }> {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds)
    .is("disabled_at", null);

  if (error) throw error;

  let sent = 0;
  let failed = 0;
  const toDelete: string[] = [];

  for (const sub of subs ?? []) {
    const count = thirstyByUser[sub.user_id] ?? 0;
    const message = buildMessage(count);
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: message.title, body: message.body, url: "/dashboard/thirsty" }),
      );
      sent++;
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      if (status === 410 || status === 404) {
        toDelete.push(sub.id);
      } else {
        console.warn(`VAPID push failed for sub ${sub.id}: ${status}`, err?.body ?? "");
      }
      failed++;
    }
  }

  if (toDelete.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", toDelete);
  }

  return { sent, failed, skipped: 0 };
}

/**
 * Envía notifs a los Expo push tokens de los usuarios.
 * Expo Push API permite mandar batches de hasta 100 mensajes por request,
 * así que paginamos. Para v1 con pocos usuarios, un solo batch alcanza.
 */
async function sendExpoNotifications(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
  thirstyByUser: Record<string, number>,
  accessToken: string | undefined,
): Promise<{ sent: number; failed: number; invalidTokens: number }> {
  const { data: tokens, error } = await supabase
    .from("expo_push_subscriptions")
    .select("id, user_id, expo_token")
    .in("user_id", userIds);

  if (error) throw error;

  if (!tokens || tokens.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: 0 };
  }

  const messages: ExpoPushMessage[] = tokens.map((t) => {
    const count = thirstyByUser[t.user_id] ?? 0;
    const { title, body } = buildMessage(count);
    return {
      to: t.expo_token,
      title,
      body,
      sound: "default",
      priority: "default",
      data: { screen: "thirsty" },
    };
  });

  // Batch de 100. Para v1 va a ser <100, pero dejamos preparado.
  const BATCH = 100;
  let sent = 0;
  let failed = 0;
  const invalidTokenIds: string[] = [];

  for (let i = 0; i < messages.length; i += BATCH) {
    const batch = messages.slice(i, i + BATCH);
    const tokenBatch = tokens.slice(i, i + BATCH);

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      console.warn("Expo push batch failed:", response.status, await response.text());
      failed += batch.length;
      continue;
    }

    const result = (await response.json()) as ExpoPushResponse;
    result.data.forEach((ticket, idx) => {
      if (ticket.status === "ok") {
        sent++;
      } else {
        failed++;
        // DeviceNotRegistered = token inválido, hay que limpiarlo.
        if (ticket.details?.error === "DeviceNotRegistered") {
          const tokenRow = tokenBatch[idx];
          if (tokenRow) invalidTokenIds.push(tokenRow.id);
        } else {
          console.warn(`Expo push ticket error:`, ticket);
        }
      }
    });
  }

  if (invalidTokenIds.length > 0) {
    await supabase.from("expo_push_subscriptions").delete().in("id", invalidTokenIds);
  }

  return { sent, failed, invalidTokens: invalidTokenIds.length };
}

function buildMessage(count: number): { title: string; body: string } {
  const title =
    count === 1
      ? "🌱 1 planta necesita riego hoy"
      : `🌱 ${count} plantas necesitan riego hoy`;
  const body = "Abrí Musgo para ver cuáles tienen sed.";
  return { title, body };
}
