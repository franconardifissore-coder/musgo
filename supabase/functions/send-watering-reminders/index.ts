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
 * Secrets requeridos (configurar en Supabase Dashboard → Settings → Edge Functions):
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT   (ej: "mailto:mvictoria.dg@gmail.com")
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── VAPID helpers (Web Crypto, sin dependencias externas) ────────────────────

async function importPrivateKey(base64url: string): Promise<CryptoKey> {
  // Reconstruye la clave privada P-256 desde los 32 bytes del escalar d
  const d = base64urlToBytes(base64url);
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: bytesToBase64url(d), x: "", y: "", key_ops: ["sign"] },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function importPrivateKeyFromRaw(d: Uint8Array, publicKeyBytes: Uint8Array): Promise<CryptoKey> {
  // Necesitamos x e y del punto público para construir el JWK completo
  const x = bytesToBase64url(publicKeyBytes.slice(1, 33));
  const y = bytesToBase64url(publicKeyBytes.slice(33, 65));
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: bytesToBase64url(d), x, y, key_ops: ["sign"] },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

function base64urlToBytes(b64: string): Uint8Array {
  const b64standard = b64.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64standard);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function bytesToBase64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function buildVapidJwt(
  audience: string,
  subject: string,
  publicKeyB64: string,
  privateKeyB64: string
): Promise<{ token: string; publicKeyB64: string }> {
  const header = base64urlEncode(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64urlEncode(
    JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: subject })
  );

  const publicKeyBytes = base64urlToBytes(publicKeyB64);
  const privateKeyBytes = base64urlToBytes(privateKeyB64);
  const key = await importPrivateKeyFromRaw(privateKeyBytes, publicKeyBytes);

  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sigDer = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, data);

  // DER → raw R||S (64 bytes)
  const sig = derToRaw(new Uint8Array(sigDer));
  const token = `${header}.${payload}.${bytesToBase64url(sig)}`;
  return { token, publicKeyB64 };
}

function derToRaw(der: Uint8Array): Uint8Array {
  // SEQUENCE { INTEGER r, INTEGER s }
  let offset = 2; // skip 0x30 + length
  const rLen = der[offset + 1];
  const r = der.slice(offset + 2, offset + 2 + rLen).slice(-32);
  offset += 2 + rLen;
  const sLen = der[offset + 1];
  const s = der.slice(offset + 2, offset + 2 + sLen).slice(-32);
  const raw = new Uint8Array(64);
  raw.set(new Uint8Array(32 - r.length), 0);
  raw.set(r, 32 - r.length);
  raw.set(new Uint8Array(32 - s.length), 32);
  raw.set(s, 64 - s.length);
  return raw;
}

// ─── Cifrado de payload (RFC 8291 / aes128gcm) ────────────────────────────────

async function encryptPayload(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string
): Promise<{ body: Uint8Array; headers: Record<string, string> }> {
  const plaintext = new TextEncoder().encode(payload);

  // Claves del receptor
  const receiverPublicKey = base64urlToBytes(subscription.keys.p256dh);
  const authSecret = base64urlToBytes(subscription.keys.auth);

  // Generar par efímero del servidor
  const senderKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
  const senderPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", senderKeyPair.publicKey)
  );

  // Importar clave pública del receptor
  const receiverKey = await crypto.subtle.importKey(
    "raw",
    receiverPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: receiverKey },
      senderKeyPair.privateKey,
      256
    )
  );

  // Salt aleatorio (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF para derivar la clave de cifrado y el nonce
  const prk = await hkdf(authSecret, sharedSecret, buildInfo("auth", new Uint8Array(0), new Uint8Array(0)), 32);
  const contentKey = await hkdf(salt, prk, buildInfo("aesgcm128", receiverPublicKey, senderPublicKeyRaw), 16);
  const nonce = await hkdf(salt, prk, buildInfo("nonce", receiverPublicKey, senderPublicKeyRaw), 12);

  const cryptoKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);

  // Padding (2 bytes de longitud + payload)
  const padded = new Uint8Array(2 + plaintext.length);
  padded.set(plaintext, 2);

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cryptoKey, padded)
  );

  return {
    body: encrypted,
    headers: {
      "Content-Encoding": "aesgcm",
      "Encryption": `salt=${bytesToBase64url(salt)}`,
      "Crypto-Key": `dh=${bytesToBase64url(senderPublicKeyRaw)}`,
    },
  };
}

function buildInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const info = new Uint8Array(18 + type.length + 1 + 2 + clientPublicKey.length + 2 + serverPublicKey.length);
  const enc = new TextEncoder();
  let offset = 0;
  info.set(enc.encode("Content-Encoding: "), offset); offset += 18;
  info.set(enc.encode(type), offset); offset += type.length;
  offset += 1; // null byte
  if (clientPublicKey.length > 0) {
    info[offset] = 0; info[offset + 1] = clientPublicKey.length; offset += 2;
    info.set(clientPublicKey, offset); offset += clientPublicKey.length;
    info[offset] = 0; info[offset + 1] = serverPublicKey.length; offset += 2;
    info.set(serverPublicKey, offset);
  }
  return info;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey", "deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    keyMaterial,
    length * 8
  );
  return new Uint8Array(bits);
}

// ─── Envío de una push notification ──────────────────────────────────────────

async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string },
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const { token } = await buildVapidJwt(audience, vapidSubject, vapidPublicKey, vapidPrivateKey);
  const { body, headers: encHeaders } = await encryptPayload(subscription, JSON.stringify(payload));

  return fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      ...encHeaders,
      "Authorization": `vapid t=${token},k=${vapidPublicKey}`,
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
    },
    body,
  });
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const vapidPublicKey  = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject    = Deno.env.get("VAPID_SUBJECT") ?? "mailto:mvictoria.dg@gmail.com";
    const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Buscar plantas que necesitan riego hoy, agrupadas por usuario
    const today = new Date().toISOString().split("T")[0];
    const { data: plants, error: plantsError } = await supabase
      .from("plants")
      .select("user_id, freq, water_log");

    if (plantsError) throw plantsError;

    // Calcular qué usuarios tienen plantas con sed hoy
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

      try {
        const res = await sendPush(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          { title, body, url: "/dashboard/thirsty" },
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );

        if (res.status === 410 || res.status === 404) {
          // Suscripción expirada — limpiar
          toDelete.push(sub.id);
          failed++;
        } else if (res.ok) {
          sent++;
        } else {
          console.warn(`Push failed for sub ${sub.id}: ${res.status}`);
          failed++;
        }
      } catch (err) {
        console.error(`Push error for sub ${sub.id}:`, err);
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
