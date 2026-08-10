#!/usr/bin/env node
/*
 * FRED researcher: refreshes the live FRED-backed readings in data.json.
 *
 * For each mapped row it pulls the latest valid observation from the FRED API
 * and writes the mutable fields the console reads (value, as_of, citation,
 * source). It deliberately leaves `status` untouched: the console derives the
 * status of live rows deterministically from the reading (see assets/js/derive.js),
 * so the reading is the only input this job needs to supply.
 *
 * Designed to be run on a schedule by a Cursor automation (scheduled agent):
 * the agent runs the script, reviews the diff, and commits data.json. It can
 * also be run by hand or from any other scheduler.
 *
 * Usage:
 *   FRED_API_KEY=xxxx node scripts/update-from-fred.mjs [--dry-run]
 *   FRED_API_KEY=xxxx npm run update:data
 *
 * Env:
 *   FRED_API_KEY   required — https://fredaccount.stlouisfed.org/apikeys
 *   FRED_BASE_URL  optional — overrides the API base (used by tests)
 *   DATA_FILE      optional — path to data.json (defaults to repo data.json)
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_FILE = process.env.DATA_FILE
  ? resolve(process.env.DATA_FILE)
  : resolve(__dirname, "..", "data.json");

const FRED_BASE_URL = (process.env.FRED_BASE_URL || "https://api.stlouisfed.org/fred").replace(/\/$/, "");
const SERIES_PAGE = "https://fred.stlouisfed.org/series/";

/* Rows in data.json that map cleanly to a single FRED series. `format` turns a
 * numeric observation into the reading string the console expects. Extend this
 * list to bring more single-series FRED rows under the daily refresh. */
const MAPPINGS = [
  { rowId: "r-dgs2",   seriesId: "DGS2",   format: percent },
  { rowId: "r-dgs30",  seriesId: "DGS30",  format: percent },
  { rowId: "r-dgs10",  seriesId: "DGS10",  format: percent },
  { rowId: "r-dfii10", seriesId: "DFII10", format: percent },
  { rowId: "r-dff",    seriesId: "DFF",    format: percent },
];

function percent(n) {
  return `${n.toFixed(2)}%`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchLatestObservation(seriesId, apiKey) {
  const url = new URL(`${FRED_BASE_URL}/series/observations`);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", "10");

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`);
  }
  const json = await res.json();
  const observations = Array.isArray(json.observations) ? json.observations : [];
  // FRED represents a missing reading (holiday, not-yet-published) as ".".
  const latest = observations.find((o) => o && o.value != null && o.value !== "." && o.value !== "");
  if (!latest) throw new Error(`no valid observations returned for ${seriesId}`);
  const n = Number(latest.value);
  if (!Number.isFinite(n)) throw new Error(`non-numeric observation "${latest.value}" for ${seriesId}`);
  return { value: n, date: latest.date };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.error("FRED_API_KEY is not set. Add it as a secret and re-run.");
    process.exit(1);
  }

  const raw = await readFile(DATA_FILE, "utf8");
  const data = JSON.parse(raw);
  const rowsById = new Map((data.rows || []).map((r) => [r.id, r]));

  const changes = [];
  const failures = [];

  for (const { rowId, seriesId, format } of MAPPINGS) {
    const row = rowsById.get(rowId);
    if (!row) {
      failures.push(`${rowId}: row not found in data.json`);
      continue;
    }
    try {
      const obs = await fetchLatestObservation(seriesId, apiKey);
      const nextValue = format(obs.value);
      const citation = `${SERIES_PAGE}${seriesId}`;
      const before = row.value;
      row.value = nextValue;
      row.as_of = obs.date;
      row.citation = citation;
      row.source = "FRED";
      changes.push({ rowId, seriesId, before, after: nextValue, as_of: obs.date });
    } catch (err) {
      failures.push(`${rowId} (${seriesId}): ${err.message}`);
    }
  }

  if (changes.length) {
    data.asOf = todayISO();
  }

  console.log(`FRED update — ${changes.length} row(s) refreshed, ${failures.length} failure(s).`);
  for (const c of changes) {
    console.log(`  ${c.rowId} [${c.seriesId}] ${c.before ?? "null"} -> ${c.after} (as_of ${c.as_of})`);
  }
  for (const f of failures) {
    console.warn(`  ! ${f}`);
  }

  if (!changes.length) {
    console.error("No rows were updated; leaving data.json unchanged.");
    process.exit(1);
  }

  if (dryRun) {
    console.log("--dry-run: data.json not written.");
    return;
  }

  await writeFile(DATA_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Wrote ${DATA_FILE}`);
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});
