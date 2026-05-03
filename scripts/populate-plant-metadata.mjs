#!/usr/bin/env node
// ============================================================
// Pre-popula la tabla plant_metadata llamando a la edge function
// `plant-metadata` para cada especie listada en un archivo de
// texto (default: scripts/seed-plants.txt).
//
// Uso:
//   node scripts/populate-plant-metadata.mjs
//   node scripts/populate-plant-metadata.mjs scripts/seed-plants.txt
//   node scripts/populate-plant-metadata.mjs scripts/seed-plants.txt --batch=50
//   node scripts/populate-plant-metadata.mjs scripts/seed-plants.txt --force
//
// Opciones:
//   --batch=N    procesa solo las primeras N entradas no cacheadas
//   --start=N    arranca desde la línea N del archivo (1-indexed)
//   --force      ignora el cache y regenera con el LLM
//   --delay=ms   delay entre requests (default 300ms)
// ============================================================

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FUNCTION_URL =
  "https://hbojzifhocxygdojzqjn.supabase.co/functions/v1/plant-metadata";

function parseArgs(argv) {
  const args = { file: null, batch: Infinity, start: 1, force: false, delay: 300 };
  for (const a of argv) {
    if (a.startsWith("--batch=")) args.batch = Number(a.split("=")[1]) || Infinity;
    else if (a.startsWith("--start=")) args.start = Number(a.split("=")[1]) || 1;
    else if (a.startsWith("--delay=")) args.delay = Number(a.split("=")[1]) || 300;
    else if (a === "--force") args.force = true;
    else if (!a.startsWith("--") && !args.file) args.file = a;
  }
  if (!args.file) {
    args.file = path.join(__dirname, "seed-plants.txt");
  }
  return args;
}

async function loadSeedList(file) {
  const raw = await fs.readFile(file, "utf8");
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

async function callEdgeFunction(scientificName, force) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scientificName, force }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`bad_response_${res.status}: ${text.slice(0, 120)}`);
  }
  if (!res.ok) {
    throw new Error(
      `${data?.error || `http_${res.status}`}: ${data?.details ?? ""}`,
    );
  }
  return data;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fmtDuration(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Archivo:  ${args.file}`);
  console.log(`Batch:    ${args.batch === Infinity ? "todo" : args.batch}`);
  console.log(`Start:    ${args.start}`);
  console.log(`Force:    ${args.force}`);
  console.log(`Delay:    ${args.delay}ms`);
  console.log("");

  const all = await loadSeedList(args.file);
  const slice = all.slice(args.start - 1);
  console.log(`Total especies en archivo: ${all.length}`);
  console.log(`Procesando desde la #${args.start} en adelante (${slice.length} candidatas)`);
  console.log("");

  const stats = { cache: 0, haiku: 0, errors: 0 };
  const errors = [];
  const t0 = Date.now();
  let processed = 0;

  for (let i = 0; i < slice.length; i++) {
    if (processed >= args.batch) break;
    const name = slice[i];
    const idx = args.start + i;
    const label = `[${String(idx).padStart(3, " ")}/${all.length}] ${name}`;

    try {
      const res = await callEdgeFunction(name, args.force);
      const src = res.source || "?";
      stats[src] = (stats[src] || 0) + 1;
      processed += 1;

      const m = res.metadata || {};
      const summary = src === "cache"
        ? "cache hit"
        : `${m.common_name ?? "?"} | ${m.light ?? "?"} | riego ${m.watering_level ?? "?"} cada ${m.watering_freq_days ?? "?"}d | ${m.origin ?? "?"}`;
      console.log(`✓ ${label}  →  [${src}] ${summary}`);
    } catch (err) {
      stats.errors += 1;
      errors.push({ name, error: err.message });
      console.log(`✗ ${label}  →  ERROR: ${err.message}`);
    }

    if (args.delay && i < slice.length - 1 && processed < args.batch) {
      await sleep(args.delay);
    }
  }

  const elapsed = Date.now() - t0;
  console.log("");
  console.log("─".repeat(60));
  console.log(`Procesadas:  ${processed}`);
  console.log(`  cache:     ${stats.cache || 0}`);
  console.log(`  haiku:     ${stats.haiku || 0}`);
  console.log(`  errores:   ${stats.errors || 0}`);
  console.log(`Tiempo:      ${fmtDuration(elapsed)}`);
  if (errors.length) {
    console.log("");
    console.log("Errores:");
    for (const { name, error } of errors) console.log(`  - ${name}: ${error}`);
  }
}

main().catch((err) => {
  console.error("Fallo fatal:", err);
  process.exit(1);
});
