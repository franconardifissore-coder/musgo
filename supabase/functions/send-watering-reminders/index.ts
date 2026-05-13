/**
 * send-watering-reminders
 *
 * Edge Function que:
 *  1. Busca todos los usuarios con plantas que necesitan riego hoy
 *  2. Para cada uno, busca sus push subscriptions
 *  3. Envía una Web Push notification con el resumen
 *
 * Llamada por pg_cron cada día a las 9am UTC.
 * También puede llamarse manualmente con POST para testing.
 *
 * Secrets requeridos (Supabase Dashboard → Edge Functions → Secrets):
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT   (ej: "mailto:tu@email.com")
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const vapidPublicKey  = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject    = Deno.env.get("VAPID_SUBJECT") ?? "mailto:musgo@example.com";
    const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Buscar plantas que necesitan riego hoy, agrupadas por usuario
    const today = new Date().toISOString().split("T")[0];
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
      return new Response(JSON.stringify({ sent: 0, message: "No thirsty plants today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Buscar suscripciones de esos usuarios
    const { data: subs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (subsError) throw subsError;

    // 3. Enviar push a cada suscripción
    let sent = 0;
    let failed = 0;
    const toDelete: string[] = [];

    for (const sub of subs ?? []) {
      const count = thirstyByUser[sub.user_id] ?? 0;
      const title = count === 1 ? "🌱 Una planta necesita agua" : `🌱 ${count} plantas necesitan agua`;
      const body  = "Abrí Musgo para ver cuáles están con sed hoy.";

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({ title, body, url: "/dashboard/thirsty" })
        );
        sent++;
      } catch (err: any) {
        const status = err?.statusCode ?? err?.status;
        if (status === 410 || status === 404) {
          toDelete.push(sub.id);
        } else {
          console.warn(`Push failed for sub ${sub.id}: ${status}`, err?.body ?? "");
        }
        failed++;
      }
    }

    // 4. Limpiar suscripciones expiradas
    if (toDelete.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", toDelete);
    }

    return new Response(JSON.stringify({ sent, failed, usersNotified: userIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("send-watering-reminders error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
