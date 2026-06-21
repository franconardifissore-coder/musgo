/**
 * backfill-fun-facts.mjs
 *
 * Genera fun_fact para todos los registros de plant_metadata que aún no
 * tienen uno. Llama a Claude Haiku directamente con un prompt reducido
 * (solo pide el fun_fact) para no sobreescribir los demás campos ya
 * verificados (common_name, origin, light, watering_level, etc.).
 *
 * Uso:
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   ANTHROPIC_API_KEY=sk-ant-... \
 *   node scripts/backfill-fun-facts.mjs
 *
 * Flags opcionales:
 *   --dry-run   Muestra qué haría sin escribir en la base
 *   --limit N   Procesa solo los primeros N registros (para probar)
 */

import https from 'https';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY   = process.env.ANTHROPIC_API_KEY;
const MODEL               = 'claude-haiku-4-5-20251001';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_IDX = process.argv.indexOf('--limit');
const LIMIT = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : Infinity;

// Pausa entre llamadas a la API para no saturar el rate limit.
const DELAY_MS = 300;

// ─── Validación de entorno ────────────────────────────────────────────────────

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ANTHROPIC_API_KEY) {
  console.error('❌  Faltan variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Claude Haiku — solo fun_fact ────────────────────────────────────────────

const FUN_FACT_TOOL = {
  name: 'save_fun_fact',
  description: 'Guarda el dato curioso de una especie de planta.',
  input_schema: {
    type: 'object',
    properties: {
      fun_fact: {
        type: 'string',
        description:
          'Un dato curioso, sorprendente o poco conocido sobre esta especie. ' +
          'Máximo 2 oraciones en español de España (tuteo, no voseo), sin emojis. ' +
          'Algo que sorprenda a alguien que la tiene en casa: puede ser sobre su historia, ' +
          'comportamiento, nombre, toxicidad, récords botánicos, usos culturales, ' +
          'o cualquier curiosidad genuinamente interesante.',
      },
    },
    required: ['fun_fact'],
  },
};

const SYSTEM_PROMPT =
  'Eres una experta en botánica y horticultura especializada en plantas de interior. ' +
  'Responde en español de España (tuteo, no voseo), sin emojis, con valores concisos.';

async function generateFunFact(scientificName) {
  const body = JSON.stringify({
    model: MODEL,
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    tools: [FUN_FACT_TOOL],
    tool_choice: { type: 'tool', name: 'save_fun_fact' },
    messages: [
      {
        role: 'user',
        content: `Genera un dato curioso sobre: ${scientificName}`,
      },
    ],
  });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const toolUse = Array.isArray(json?.content)
    ? json.content.find((b) => b?.type === 'tool_use')
    : null;

  const funFact = toolUse?.input?.fun_fact;
  if (!funFact || typeof funFact !== 'string' || !funFact.trim()) {
    throw new Error('anthropic_no_fun_fact');
  }

  return funFact.trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌿 Backfill fun_fact${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  // 1. Traer todos los registros sin fun_fact
  const rows = await supabaseFetch(
    '/plant_metadata?fun_fact=is.null&select=scientific_name&order=scientific_name.asc',
    { headers: { 'Prefer': 'return=representation' } },
  );

  if (!rows || rows.length === 0) {
    console.log('✅  No hay registros sin fun_fact. Nada que hacer.');
    return;
  }

  const total = Math.min(rows.length, LIMIT);
  console.log(`📋  ${rows.length} registros sin fun_fact${LIMIT < rows.length ? ` (procesando los primeros ${total})` : ''}.\n`);

  let ok = 0;
  let errors = 0;

  for (let i = 0; i < total; i++) {
    const { scientific_name } = rows[i];
    const prefix = `[${String(i + 1).padStart(3, ' ')}/${total}]`;

    process.stdout.write(`${prefix} ${scientific_name} … `);

    try {
      const funFact = await generateFunFact(scientific_name);

      if (DRY_RUN) {
        console.log(`\n         💬 ${funFact}\n`);
      } else {
        await supabaseFetch(
          `/plant_metadata?scientific_name=eq.${encodeURIComponent(scientific_name)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ fun_fact: funFact }),
          },
        );
        console.log('✅');
        if (i < total - 1) process.stdout.write(`         💬 ${funFact.slice(0, 90)}${funFact.length > 90 ? '…' : ''}\n`);
      }

      ok++;
    } catch (err) {
      console.log(`❌  ${err.message}`);
      errors++;
    }

    if (i < total - 1) await sleep(DELAY_MS);
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`✅  OK: ${ok}   ❌  Errores: ${errors}   Total: ${total}`);
  if (!DRY_RUN && errors > 0) {
    console.log(`\n💡  Puedes volver a correr el script; solo procesará los que quedaron sin fun_fact.`);
  }
}

main().catch((err) => {
  console.error('\n💥  Error fatal:', err.message);
  process.exit(1);
});
