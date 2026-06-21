import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function normalizeScientificName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

// Tool schema que fuerza al modelo a devolver exactamente los
// campos que necesitamos, en los valores que la app entiende.
const TOOL = {
  name: "save_plant_metadata",
  description:
    "Guarda la metadata estructurada de cuidados de una especie de planta.",
  input_schema: {
    type: "object",
    properties: {
      common_name: {
        type: "string",
        description:
          "Nombre común en español más usado para la especie (ej. 'Costilla de Adán', 'Potos'). Si no hay un nombre común en español, usar el nombre común en inglés.",
      },
      origin: {
        type: "string",
        description:
          "Región geográfica de origen, en español, lo más concisa posible. Ejemplos: 'Sudeste asiático', 'Centroamérica', 'México', 'África tropical', 'Sur de Brasil'.",
      },
      light: {
        type: "string",
        enum: ["directa", "indirecta"],
        description:
          "Tipo de luz que prefiere la planta. 'directa' si necesita sol directo varias horas al día (cactus, suculentas, cítricos). 'indirecta' si prefiere luz brillante pero sin sol directo (la mayoría de plantas de interior).",
      },
      watering_level: {
        type: "string",
        enum: ["alto", "medio", "bajo"],
        description:
          "Necesidad general de agua. 'alto' = sustrato siempre húmedo (helechos, calatheas). 'medio' = regar cuando los primeros 2-3cm del sustrato están secos (la mayoría de aroides). 'bajo' = dejar secar completamente entre riegos (suculentas, cactus, sansevierias).",
      },
      watering_freq_days: {
        type: "integer",
        minimum: 1,
        maximum: 30,
        description:
          "Cada cuántos días regar en condiciones promedio de interior (luz brillante indirecta, ~22°C, humedad media). Valor típico: 1-3 para alto, 5-7 para medio, 14-21 para bajo. Debe ser uno de: 1, 2, 3, 5, 7, 14, 21, 30.",
      },
      fun_fact: {
        type: "string",
        description:
          "Un dato curioso, sorprendente o poco conocido sobre esta especie. Máximo 2 oraciones en español de España (tuteo, no voseo), sin emojis. Algo que sorprenda a alguien que la tiene en casa: puede ser sobre su historia, comportamiento, nombre, toxicidad, récords botánicos, usos culturales, o cualquier curiosidad genuinamente interesante.",
      },
    },
    required: [
      "common_name",
      "origin",
      "light",
      "watering_level",
      "watering_freq_days",
      "fun_fact",
    ],
  },
};

const SYSTEM_PROMPT =
  "Eres una experta en botánica y horticultura especializada en plantas de interior. " +
  "Te van a pasar el nombre científico de una planta y tienes que devolver su metadata de cuidados " +
  "usando la tool save_plant_metadata. Responde en español de España, sin emojis, con valores concisos. " +
  "Si la especie no existe o el nombre tiene un error de tipografía evidente, usa tu mejor juicio para " +
  "interpretar a qué planta se refiere y devuelve la metadata para esa.";

type LlmMetadata = {
  common_name: string;
  origin: string;
  light: "directa" | "indirecta";
  watering_level: "alto" | "medio" | "bajo";
  watering_freq_days: number;
  fun_fact: string;
};

async function callHaiku(
  apiKey: string,
  scientificName: string,
): Promise<{ metadata: LlmMetadata; raw: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "save_plant_metadata" },
        messages: [
          {
            role: "user",
            content: `Generá la metadata de cuidados para: ${scientificName}`,
          },
        ],
      }),
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`anthropic_${res.status}:${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const toolUse = Array.isArray(json?.content)
    ? json.content.find((b: any) => b?.type === "tool_use")
    : null;
  if (!toolUse?.input) {
    throw new Error("anthropic_no_tool_use");
  }

  const m = toolUse.input as LlmMetadata;
  if (
    !m.common_name ||
    !m.origin ||
    !["directa", "indirecta"].includes(m.light) ||
    !["alto", "medio", "bajo"].includes(m.watering_level) ||
    !Number.isInteger(m.watering_freq_days) ||
    !m.fun_fact
  ) {
    throw new Error("anthropic_invalid_metadata");
  }

  return { metadata: m, raw: json };
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
    const force = Boolean(body?.force);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "missing_supabase_env" }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Cache hit?
    if (!force) {
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
    }

    // 2. Cache miss → llamar a Claude Haiku.
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return jsonResponse({ error: "missing_anthropic_api_key" }, 503);
    }

    let llm: { metadata: LlmMetadata; raw: unknown };
    try {
      llm = await callHaiku(anthropicKey, scientificName);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonResponse(
        { error: "anthropic_call_failed", details: message },
        502,
      );
    }

    const row = {
      scientific_name: scientificName,
      common_name: llm.metadata.common_name,
      origin: llm.metadata.origin,
      light: llm.metadata.light,
      watering_level: llm.metadata.watering_level,
      watering_freq_days: llm.metadata.watering_freq_days,
      fun_fact: llm.metadata.fun_fact,
      raw: llm.raw,
      source: "haiku",
      model: MODEL,
    };

    const { data: upserted, error: upsertError } = await supabase
      .from("plant_metadata")
      .upsert(row, { onConflict: "scientific_name" })
      .select("*")
      .single();

    if (upsertError) {
      return jsonResponse({
        source: "haiku",
        metadata: row,
        warning: `cache_write_failed: ${upsertError.message}`,
      });
    }

    return jsonResponse({ source: "haiku", metadata: upserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
