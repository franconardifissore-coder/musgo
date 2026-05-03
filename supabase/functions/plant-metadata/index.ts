import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PERENUAL_BASE = "https://perenual.com/api/v2";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

// Normaliza el nombre científico para usarlo como primary key.
// Lower + collapse de espacios + trim.
function normalizeScientificName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

type PerenualSearchHit = {
  id: number;
  common_name?: string | null;
  scientific_name?: string[] | null;
};

type PerenualDetails = {
  id: number;
  common_name?: string | null;
  scientific_name?: string[] | null;
  family?: string | null;
  type?: string | null;
  cycle?: string | null;
  watering?: string | null;
  watering_general_benchmark?: { value?: string | null; unit?: string | null } | null;
  sunlight?: string[] | null;
  origin?: string[] | null;
  [k: string]: unknown;
};

async function fetchWithTimeout(url: string, ms = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function searchPerenual(
  apiKey: string,
  scientificName: string,
): Promise<PerenualSearchHit | null> {
  const q = encodeURIComponent(scientificName);
  const url = `${PERENUAL_BASE}/species-list?key=${apiKey}&q=${q}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`perenual_search_failed_${res.status}`);
  }
  const json = await res.json();
  const hits: PerenualSearchHit[] = Array.isArray(json?.data) ? json.data : [];
  if (hits.length === 0) return null;

  // Match exact por nombre científico si es posible, si no devolver el primero.
  const target = scientificName.toLowerCase();
  const exact = hits.find((h) =>
    Array.isArray(h?.scientific_name) &&
    h.scientific_name.some((s) => String(s).toLowerCase() === target)
  );
  return exact ?? hits[0];
}

async function fetchPerenualDetails(
  apiKey: string,
  id: number,
): Promise<PerenualDetails> {
  const url = `${PERENUAL_BASE}/species/details/${id}?key=${apiKey}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`perenual_details_failed_${res.status}`);
  }
  return await res.json();
}

function shapeRow(scientificName: string, details: PerenualDetails) {
  const benchmark = details.watering_general_benchmark ?? null;
  const sunlight = Array.isArray(details.sunlight)
    ? details.sunlight.filter((s) => typeof s === "string")
    : null;
  const origin = Array.isArray(details.origin)
    ? details.origin.filter((s) => typeof s === "string")
    : null;

  return {
    scientific_name: scientificName,
    perenual_id: details.id ?? null,
    common_name: details.common_name ?? null,
    family: details.family ?? null,
    type: details.type ?? null,
    cycle: details.cycle ?? null,
    watering: details.watering ?? null,
    watering_benchmark_value: benchmark?.value ?? null,
    watering_benchmark_unit: benchmark?.unit ?? null,
    sunlight,
    origin,
    raw: details,
    source: "perenual",
  };
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json().catch(() => null);
    const rawName = typeof body?.scientificName === "string"
      ? body.scientificName
      : "";
    const scientificName = normalizeScientificName(rawName);
    if (!scientificName) {
      return jsonResponse({ error: "missing_scientific_name" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "missing_supabase_env" }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Cache hit?
    const { data: cached, error: cacheError } = await supabase
      .from("plant_metadata")
      .select("*")
      .eq("scientific_name", scientificName)
      .maybeSingle();

    if (cacheError) {
      return jsonResponse(
        { error: "cache_read_failed", details: cacheError.message },
        500,
      );
    }

    if (cached) {
      return jsonResponse({ source: "cache", metadata: cached });
    }

    // 2. Cache miss → llamar Perenual.
    const perenualKey = Deno.env.get("PERENUAL_API_KEY");
    if (!perenualKey) {
      return jsonResponse({ error: "missing_perenual_api_key" }, 503);
    }

    let hit: PerenualSearchHit | null;
    try {
      hit = await searchPerenual(perenualKey, scientificName);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonResponse(
        { error: "perenual_search_error", details: message },
        502,
      );
    }

    if (!hit) {
      return jsonResponse({
        source: "perenual",
        metadata: null,
        notFound: true,
      });
    }

    let details: PerenualDetails;
    try {
      details = await fetchPerenualDetails(perenualKey, hit.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonResponse(
        { error: "perenual_details_error", details: message },
        502,
      );
    }

    const row = shapeRow(scientificName, details);

    const { data: upserted, error: upsertError } = await supabase
      .from("plant_metadata")
      .upsert(row, { onConflict: "scientific_name" })
      .select("*")
      .single();

    if (upsertError) {
      // Aún si falla la cache podemos devolver lo que trajimos.
      return jsonResponse({
        source: "perenual",
        metadata: row,
        warning: `cache_write_failed: ${upsertError.message}`,
      });
    }

    return jsonResponse({ source: "perenual", metadata: upserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
