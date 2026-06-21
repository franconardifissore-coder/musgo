/**
 * delete-account
 *
 * Edge Function que borra la cuenta del usuario autenticado.
 *
 * Pasos:
 *  1. Valida que la request venga con un access_token JWT válido.
 *  2. Borra fila de auth.users con la admin API. Como las tablas de
 *     dominio (plants, sections, push_subscriptions, expo_push_subscriptions)
 *     tienen FK con ON DELETE CASCADE a auth.users, todo el contenido se
 *     borra con esa única operación.
 *  3. Devuelve 204 No Content.
 *
 * Lo importante: este endpoint usa la SERVICE ROLE key, así que tiene
 * permisos para borrar usuarios. Por eso la validación del JWT es crítica
 * — sin eso, cualquiera podría borrar a cualquiera.
 *
 * Requisito Apple App Review (2022+): toda app con cuenta debe ofrecer
 * eliminar la cuenta desde dentro de la app. Esto es lo que cumple ese
 * requisito.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey        = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Validar JWT del usuario que invoca.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }
    const accessToken = authHeader.slice("Bearer ".length);

    // Cliente con anon key para verificar el JWT y resolver el user.
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser(accessToken);
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Invalid session" }, 401);
    }
    const userId = userData.user.id;

    // 2. Borrar usuario con admin API. Cascade hace el resto.
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error("delete-account: admin.deleteUser failed", deleteErr);
      return jsonResponse({ error: "Failed to delete account" }, 500);
    }

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (err) {
    console.error("delete-account error:", err);
    return jsonResponse({ error: String(err) }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
