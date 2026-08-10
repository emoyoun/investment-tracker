#!/usr/bin/env node
/*
 * FRED researcher: refreshes the FRED-backed data in data.json.
 *
 * Two things get updated:
 *
 *   1. The five single-series LIVE rows in the "Rates & fiscal-dominance" panel
 *      (DGS2/DGS30/DGS10/DFII10/DFF). For these it writes the mutable fields the
 *      console reads (value, as_of, citation, source) and deliberately leaves
 *      `status` alone — the console derives live-row status deterministically
 *      from the reading (see assets/js/derive.js).
 *
 *   2. A top-level `indicators` block holding the other FRED series that feed
 *      the composite/qualitative tripwires (PCEPILFE -> tw3, VIXCLS/DEXJPUS ->
 *      tw6, WALCL -> tw7). These rows carry an analytic reading rather than a
 *      single number, so this job does NOT overwrite their `value`; it just
 *      publishes fresh raw FRED numbers for the weekly agent (and humans) to
 *      judge against. The console ignores unknown top-level keys.
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

/* LIVE rows that map cleanly to a single FRED series. `format` turns a numeric
 * observation into the reading string the console expects. Extend this list to
 * bring more single-series FRED rows under the daily refresh. */
const MAPPINGS = [
  { rowId: "r-dgs2",   seriesId: "DGS2",   format: percent },
  { rowId: "r-dgs30",  seriesId: "DGS30",  format: percent },
  { rowId: "r-dgs10",  seriesId: "DGS10",  format: percent },
  { rowId: "r-dfii10", seriesId: "DFII10", format: percent },
  { rowId: "r-dff",    seriesId: "DFF",    format: percent },
];

/* FRED series that inform the composite tripwires. Published under the
 * top-level `indicators` block, not written onto a row's `value`. */
const CONTEXT = [
  { seriesId: "PCEPILFE", label: "Core PCE price index (YoY drives tw3)", kind: "index_yoy" },
  { seriesId: "VIXCLS",   label: "VIX close (tw6)",                        kind: "level" },
  { seriesId: "DEXJPUS",  label: "USD/JPY (tw6)",                          kind: "level" },
  { seriesId: "WALCL",    label: "Fed balance sheet, $millions (tw7)",     kind: "balance" },
];

function percent(n) {
  return `${n.toFixed(2)}%`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchObservations(seriesId, apiKey, limit) {
  const url = new URL(`${FRED_BASE_URL}/series/observations`);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`);
  }
  const json = await res.json();
  return Array.isArray(json.observations) ? json.observations : [];
}

// FRED represents a missing reading (holiday, not-yet-published) as ".".
function latestValid(observations) {
  const o = observations.find((x) => x && x.value != null && x.value !== "." && x.value !== "");
  if (!o) return null;
  const n = Number(o.value);
  if (!Number.isFinite(n)) return null;
  return { value: n, raw: o.value, date: o.date };
}

async function updateRows(data, apiKey) {
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
      const obs = latestValid(await fetchObservations(seriesId, apiKey, 10));
      if (!obs) throw new Error("no valid observations");
      const nextValue = format(obs.value);
      const before = row.value;
      row.value = nextValue;
      row.as_of = obs.date;
      row.citation = `${SERIES_PAGE}${seriesId}`;
      row.source = "FRED";
      changes.push({ rowId, seriesId, before, after: nextValue, as_of: obs.date });
    } catch (err) {
      failures.push(`${rowId} (${seriesId}): ${err.message}`);
    }
  }
  return { changes, failures };
}

async function buildContext(apiKey) {
  const series = {};
  const failures = [];

  for (const { seriesId, label, kind } of CONTEXT) {
    try {
      const limit = kind === "index_yoy" ? 15 : 10;
      const observations = await fetchObservations(seriesId, apiKey, limit);
      const latest = latestValid(observations);
      if (!latest) throw new Error("no valid observations");

      const entry = {
        label,
        value: latest.raw,
        as_of: latest.date,
        citation: `${SERIES_PAGE}${seriesId}`,
      };

      if (kind === "index_yoy") {
        // YoY inflation = latest index vs the same month one year earlier.
        const [y, m] = latest.date.split("-");
        const priorPrefix = `${Number(y) - 1}-${m}`;
        const prior = observations.find(
          (o) => typeof o.date === "string" && o.date.startsWith(priorPrefix) && o.value !== "."
        );
        const priorN = prior ? Number(prior.value) : NaN;
        entry.yoy_pct =
          Number.isFinite(priorN) && priorN !== 0
            ? `${(((latest.value / priorN) - 1) * 100).toFixed(1)}%`
            : null;
      } else if (kind === "balance") {
        entry.display = `$${(latest.value / 1e6).toFixed(2)}T`;
      }

      series[seriesId] = entry;
    } catch (err) {
      failures.push(`${seriesId}: ${err.message}`);
    }
  }
  return { series, failures };
}

/* Rebuild data.json with `indicators` placed immediately before `rows`, keeping
 * the original key order and never leaving a duplicate `indicators` key. */
function withIndicators(data, indicators) {
  const out = {};
  for (const key of Object.keys(data)) {
    if (key === "indicators") continue;
    if (key === "rows") {
      if (indicators) out.indicators = indicators;
      out.rows = data.rows;
    } else {
      out[key] = data[key];
    }
  }
  if (indicators && !("indicators" in out)) out.indicators = indicators;
  return out;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.error("FRED_API_KEY is not set. Add it as a secret and re-run.");
    process.exit(1);
  }

  const data = JSON.parse(await readFile(DATA_FILE, "utf8"));

  const { changes, failures: rowFailures } = await updateRows(data, apiKey);
  const { series: ctxSeries, failures: ctxFailures } = await buildContext(apiKey);

  const contextUpdated = Object.keys(ctxSeries).length > 0;
  let indicators = data.indicators || null;
  if (contextUpdated) {
    const priorSeries = (data.indicators && data.indicators.series) || {};
    indicators = { as_of: todayISO(), series: { ...priorSeries, ...ctxSeries } };
  }

  if (changes.length || contextUpdated) {
    data.asOf = todayISO();
  }

  console.log(
    `FRED update — ${changes.length} row(s) refreshed, ${Object.keys(ctxSeries).length} indicator(s), ` +
      `${rowFailures.length + ctxFailures.length} failure(s).`
  );
  for (const c of changes) {
    console.log(`  ${c.rowId} [${c.seriesId}] ${c.before ?? "null"} -> ${c.after} (as_of ${c.as_of})`);
  }
  for (const [id, e] of Object.entries(ctxSeries)) {
    const extra = e.yoy_pct ? ` yoy ${e.yoy_pct}` : e.display ? ` (${e.display})` : "";
    console.log(`  indicators.${id} = ${e.value}${extra} (as_of ${e.as_of})`);
  }
  for (const f of [...rowFailures, ...ctxFailures]) {
    console.warn(`  ! ${f}`);
  }

  if (!changes.length && !contextUpdated) {
    console.error("Nothing was updated; leaving data.json unchanged.");
    process.exit(1);
  }

  if (dryRun) {
    console.log("--dry-run: data.json not written.");
    return;
  }

  const output = withIndicators(data, indicators);
  await writeFile(DATA_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Wrote ${DATA_FILE}`);
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});
