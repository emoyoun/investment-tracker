# Tripwire Console

Early-warning dashboard for the Cautious Barbell & Bottleneck regime. It renders a fixed set of
tripwires, context panels, a deployment ladder, a macro-thinker scorecard and compliance screens,
and reads its readings from a single file: **`data.json`**.

No build step, no dependencies, no framework. It is plain HTML, CSS and JavaScript served as static
files.

---

## Running it

`data.json` is fetched over HTTP, and browsers block `fetch` on `file://` URLs — so opening
`index.html` by double-clicking it will show seed values and a warning banner. Serve the folder
instead:

```bash
npm start                      # http://localhost:8080  (uses npx serve)
# or, with no Node at all:
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

---

## Updating the dashboard

The normal loop is: **edit `data.json` → reload the page** (or press *Reload data*). That is the
whole workflow. Nothing else needs to change.

`data.json` owns only the fields that move:

| Field | Meaning |
| --- | --- |
| `value` | the reading, as you'd say it out loud — `"4.31%"`, `"official sector net buyer"` |
| `status` | `clear` \| `amber` \| `red` \| `watch` |
| `proposed_status` | a move that needs your confirm; surfaces in the action queue |
| `rationale` | one line of why |
| `confidence` | `high` \| `medium` \| `low` — defaults to `medium` |
| `citation` | source URL; required for any status change on a Filing or Event row |
| `as_of` | `YYYY-MM-DD`; anything over 7 days old renders as stale |
| `next_release` | when the next number lands |

Top-level `asOf`, `posture` and `anchor` (the SOX peak and ladder rungs) are also read from the file.

Everything else — names, sleeves, amber and red conditions, guardrails, confirm sequences, triggers,
cadence — is a **static definition** and lives in `assets/js/definitions.js`. Change it there when
the framework itself changes, not when a number changes.

A row whose fields are all `null` falls back to the seed reading in `definitions.js`, which is why a
freshly templated `data.json` still renders a complete dashboard.

---

## The rules the console enforces

These come from the `_schema` note in `data.json`, and the UI implements them rather than trusting
the payload:

1. **Live rows derive their own status.** Where a threshold is unambiguous, status is computed from
   the reading rather than asserted — 30Y above 5.2% is amber, above 6% is red; a negative 10Y real
   yield is amber; the SOX ladder's fired rungs come from the drawdown. Those chips are locked and
   marked `auto`; to move one, change the reading. A payload that asserts a conflicting status is
   told so explicitly.
2. **No citation, no status change** on Filing or Event rows. The update is rejected and named in
   the flash message.
3. **Event rows cannot trip themselves red.** A red assertion is diverted into `proposed_status`
   and lands in the action queue for you to accept or dismiss. Self-promotion to amber with a
   citation is allowed.
4. **Accept is disabled without a citation**, so a proposed move can never be confirmed on nothing.

Statuses shown in the tallies and filters are the *effective* statuses after these rules apply.

---

## Editing in the browser

Readings and notes are editable in place (click, type, `Enter` to commit, `Escape` to revert), and
the *Morning update* box at the bottom accepts a payload out of band. Both write to a **local
overlay** in `localStorage` rather than to the file, so:

- local edits are labelled `local edit` in the source line;
- they are **dropped automatically** as soon as `data.json` supplies a newer reading for that row,
  so browser state can never mask the file;
- *Copy state as data.json* / *Download data.json* serialise the current merged state back into the
  file's exact shape and row order, so you can make an in-browser session permanent;
- *Discard local edits* drops the overlay entirely.

Keyboard: `/` focuses the filter, `Escape` in the filter clears all filters.

---

## Layout

```
index.html                  page shell
data.json                   ← the file you update
assets/css/styles.css       styles
assets/js/definitions.js    static definitions + seed readings
assets/js/derive.js         numeric parsing, staleness, deterministic status rules
assets/js/store.js          fetch, three-layer merge, overlay persistence, import/export
assets/js/render.js         all DOM rendering
assets/js/app.js            wiring: filters, keyboard, buttons, clock
reference/                  the original prototype and the source spec, for provenance
```

Scripts load in that order and are plain scripts (not modules) so nothing depends on a bundler.

---

## Automated daily update (FRED)

The FRED daily rows — the *Rates & fiscal-dominance* panel (`DGS2`, `DGS30`,
`DGS10`, `DFII10`, `DFF`), the *Credit stress* panel (`BAMLH0A0HYM2` HY OAS,
`BAMLC0A0CM` IG OAS, `BAMLH0A3HYC` CCC OAS), and the *Dollar & yen plumbing*
panel (`DEXJPUS` USD/JPY, `DTWEXBGS` Broad USD) — are refreshed from the
[FRED API](https://fred.stlouisfed.org/docs/api/fred/) with:

```bash
FRED_API_KEY=your_key npm run update:data     # add --dry-run to preview
```

`scripts/update-from-fred.mjs` fetches the latest observation for each mapped
series and writes only the readings the file owns (`value`, `as_of`, `citation`,
`source`); it leaves `status` alone so the console still derives it
deterministically. It skips FRED's `"."` (holiday) readings, exits non-zero if
the key is missing or every fetch fails, and only touches `data.json`. Extend the
`MAPPINGS` array at the top of the script to bring more single-series rows under
the refresh. Get a free key at <https://fredaccount.stlouisfed.org/apikeys>.

Status for the credit rows is derived in the console (`assets/js/derive.js`): HY
OAS amber ≥3.75% / red ≥5%; IG OAS amber ≥1.25% with a compound red at ≥1.75%
**or** (≥1.25% **and** HY ≥4%) — the migration-into-quality signal, which uses a
small cross-row readings map so one row's rule can see another's value; CCC OAS is
value-only with an absolute red backstop at ≥12% (the BB↔CCC compression primary is
judged weekly). `DEXJPUS`/`DTWEXBGS` are value-only, judged on direction weekly.

The same run also publishes a top-level **`indicators`** block: the other
FRED series that feed the composite/judgment rows — `PCEPILFE` (with a computed
`yoy_pct`) for `tw3`, `VIXCLS` and `DEXJPUS` for `tw6`, `WALCL` for `tw7`, and
`BAMLH0A1HYBB` (BB OAS) for the BB↔CCC compression behind `cr-ccc-oas`.
These rows carry an analytic reading rather than a single number, so the script
does **not** overwrite their `value`; it just surfaces fresh raw FRED numbers for
a downstream agent to judge against. The console ignores the block; add a series
to the `CONTEXT` array to publish more. Example shape:

```json
"indicators": {
  "as_of": "2026-08-10",
  "series": {
    "PCEPILFE": { "label": "…", "value": "124.5", "yoy_pct": "2.6%", "as_of": "2026-06-01", "citation": "https://fred.stlouisfed.org/series/PCEPILFE" },
    "VIXCLS":   { "label": "…", "value": "15.20", "as_of": "2026-08-08", "citation": "…" },
    "DEXJPUS":  { "label": "…", "value": "148.34", "as_of": "2026-08-08", "citation": "…" },
    "WALCL":    { "label": "…", "value": "6800000", "display": "$6.80T", "as_of": "2026-08-06", "citation": "…" }
  }
}
```

Run it on a schedule with a **Cursor automation** (a scheduled agent): add
`FRED_API_KEY` as an environment secret, then point the automation's prompt at
`npm run update:data` and have it commit `data.json` when the diff looks right.
A commit to `master` triggers the Pages deploy below, so the live dashboard
follows. The script has no dependencies beyond Node 18+ (`fetch` is built in).

## Deploying

Any static host works. A GitHub Pages workflow is included at
`.github/workflows/deploy-pages.yml`; it publishes the repository root on every push to `master`
once you enable **Settings → Pages → Source: GitHub Actions**. After that, updating the dashboard is
a commit to `data.json`.

---

Monitoring instrument, not investment advice. The readings and the decisions are yours.
