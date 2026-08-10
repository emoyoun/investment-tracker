/* Data layer.
 *
 * Three layers merge, lowest precedence first:
 *
 *   1. definitions.js `seed`  — the fallback reading shipped with the console
 *   2. data.json `rows[]`     — the file the agent rewrites; source of truth
 *   3. local overlay          — edits you make in the browser (localStorage)
 *
 * The overlay is deliberately subordinate: each overlaid row records a
 * fingerprint of the data.json row it was based on, and is dropped as soon as
 * the file supplies a newer reading for that row. Editing data.json therefore
 * always wins, and stale browser state can never mask fresh data.
 */
"use strict";

window.Store = (function () {

  const DEFS = window.TRIPWIRE_DEFS;
  const TW = window.TW;
  const LS_KEY = "tripwire-console.overlay.v1";
  const DATA_URL = "data.json";

  /* Fields data.json owns. Everything else (names, conditions, triggers,
   * guardrails) stays in definitions.js and is never overridden. */
  const MUTABLE = ["value", "note", "status", "proposed_status", "rationale",
                   "confidence", "citation", "as_of", "next_release"];

  const state = {
    raw: null,          // parsed data.json, or null when unavailable
    rawError: null,     // load failure reason
    loadedFrom: null,   // "file" | "none"
    overlay: {},        // id -> { fields..., _fp }
    meta: {},           // overlay-level asOf / posture
    sections: [],       // merged, ready to render
    items: [],
    anchor: DEFS.anchor
  };

  /* ---------------- persistence ---------------- */

  function readOverlay() {
    try {
      const s = window.localStorage.getItem(LS_KEY);
      if (!s) return { rows: {}, meta: {} };
      const p = JSON.parse(s);
      return { rows: p.rows || {}, meta: p.meta || {} };
    } catch (e) { return { rows: {}, meta: {} }; }
  }

  function writeOverlay() {
    try {
      window.localStorage.setItem(LS_KEY,
        JSON.stringify({ rows: state.overlay, meta: state.meta }));
      return true;
    } catch (e) { return false; }
  }

  let persisted = true;
  function persistOk() { return persisted; }

  /* ---------------- loading ---------------- */

  async function fetchData() {
    const url = DATA_URL + "?t=" + Date.now();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status + " " + res.statusText);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error("data.json is not valid JSON \u2014 " + e.message);
    }
  }

  async function load() {
    const o = readOverlay();
    state.overlay = o.rows;
    state.meta = o.meta;
    try {
      state.raw = await fetchData();
      state.loadedFrom = "file";
      state.rawError = null;
    } catch (e) {
      state.raw = null;
      state.loadedFrom = "none";
      state.rawError = e;
    }
    build();
    return state;
  }

  async function reload() {
    try {
      state.raw = await fetchData();
      state.loadedFrom = "file";
      state.rawError = null;
    } catch (e) {
      state.rawError = e;
    }
    build();
    return state;
  }

  /* ---------------- merge ---------------- */

  function rawRows() {
    const map = {};
    const rows = (state.raw && state.raw.rows) || [];
    rows.forEach(r => { if (r && r.id) map[r.id] = r; });
    return map;
  }

  /* Only non-null data.json fields count as "supplied" — the template ships
   * with every mutable field null, which must not blank out the seed. */
  function suppliedFields(row) {
    const out = {};
    if (!row) return out;
    MUTABLE.forEach(k => {
      if (row[k] !== null && row[k] !== undefined && row[k] !== "") out[k] = row[k];
    });
    return out;
  }

  function fingerprint(row) {
    return JSON.stringify(suppliedFields(row));
  }

  function build() {
    const rmap = rawRows();
    state.anchor = (state.raw && state.raw.anchor) || DEFS.anchor;

    // Drop overlay entries for rows that no longer exist in the definitions,
    // so retiring a tripwire doesn't leave a phantom local edit behind.
    const known = {};
    DEFS.sections.forEach(s => s.items.forEach(d => { known[d.id] = true; }));
    Object.keys(state.overlay).forEach(id => { if (!known[id]) delete state.overlay[id]; });

    const items = [];
    state.sections = DEFS.sections.map(sec => {
      const secItems = sec.items.map(def => {
        const fromFile = suppliedFields(rmap[def.id]);
        const fp = fingerprint(rmap[def.id]);

        // Drop overlay rows whose basis has changed in the file.
        const ov = state.overlay[def.id];
        if (ov && ov._fp !== undefined && ov._fp !== fp) {
          delete state.overlay[def.id];
        }
        const local = state.overlay[def.id] || null;

        const item = Object.assign({}, def, def.seed || {}, fromFile);
        if (local) {
          MUTABLE.forEach(k => { if (k in local) item[k] = local[k]; });
        }

        item.as_of = item.as_of || (Object.keys(fromFile).length
          ? (state.raw && state.raw.asOf) || null
          : DEFS.meta.seedAsOf);

        item.origin = local ? "local" : (Object.keys(fromFile).length ? "data" : "seed");
        item.inFile = !!rmap[def.id];
        delete item.seed;
        items.push(item);
        return item;
      });
      return Object.assign({}, sec, { items: secItems });
    });

    state.items = items;
    state.asOf = (state.meta.asOf) || (state.raw && state.raw.asOf) || DEFS.meta.seedAsOf;
    state.posture = (state.meta.posture) || (state.raw && state.raw.posture) || DEFS.meta.seedPosture;
    return state;
  }

  function find(id) {
    return state.items.find(i => i.id === id) || null;
  }

  /* ---------------- mutation (writes to the overlay) ---------------- */

  function setFields(id, fields) {
    const rmap = rawRows();
    const cur = state.overlay[id] || { _fp: fingerprint(rmap[id]) };
    Object.keys(fields).forEach(k => { cur[k] = fields[k]; });
    state.overlay[id] = cur;
    persisted = writeOverlay();
    build();
  }

  function setMeta(fields) {
    Object.assign(state.meta, fields);
    persisted = writeOverlay();
    build();
  }

  function clearLocal() {
    state.overlay = {};
    state.meta = {};
    persisted = writeOverlay();
    build();
  }

  function localCount() {
    return Object.keys(state.overlay).length;
  }

  /* ---------------- payload application ---------------- */

  /* Mirrors the console rules:
   *   - Event/Filing rows need a citation for any status change, else rejected.
   *   - A red assertion on an Event row is diverted to proposed_status, so it
   *     lands in the action queue instead of tripping unilaterally.
   *   - Rows with a deterministic rule ignore an asserted status entirely. */
  function applyPayload(p) {
    const res = { applied: 0, missed: [], rejected: [], diverted: [], overridden: [] };
    if (!p || typeof p !== "object") throw new Error("payload is not an object");

    const meta = {};
    if (p.asOf) meta.asOf = String(p.asOf);
    if (p.posture) meta.posture = String(p.posture);
    if (Object.keys(meta).length) Object.assign(state.meta, meta);

    const rows = p.rows || p.updates || p.items || [];
    if (!Array.isArray(rows)) throw new Error("`rows` must be an array");

    rows.forEach(u => {
      if (!u || !u.id) { res.missed.push("(row with no id)"); return; }
      const item = find(u.id);
      if (!item) { res.missed.push(u.id); return; }

      const needsCite = (item.cls === "event" || item.cls === "filing");
      const willCite = (u.citation != null && u.citation !== "") ? u.citation : item.citation;
      const assertsStatus = !!(u.status || u.proposed_status);
      if (needsCite && assertsStatus && !willCite) { res.rejected.push(u.id); return; }

      const fields = {};
      ["value", "note", "rationale", "confidence", "citation", "as_of", "next_release"]
        .forEach(k => { if (u[k] != null) fields[k] = String(u[k]); });

      if (u.status && TW.CYCLE.indexOf(u.status) !== -1) {
        if (TW.derived(Object.assign({}, item, fields), state.anchor)) {
          res.overridden.push(u.id);                      // rule wins over assertion
        } else if (item.cls === "event" && u.status === "red") {
          fields.proposed_status = "red";                 // needs your confirm
          res.diverted.push(u.id);
        } else {
          fields.status = u.status;
        }
      }
      if (u.proposed_status !== undefined) {
        fields.proposed_status =
          (u.proposed_status && TW.CYCLE.indexOf(u.proposed_status) !== -1) ? u.proposed_status : null;
      }

      setFields(u.id, fields);
      res.applied++;
    });

    persisted = writeOverlay();
    build();
    return res;
  }

  /* ---------------- export ---------------- */

  /* Emits a data.json-shaped object: the original file's keys and row order are
   * preserved, with current effective values written into the mutable fields. */
  function exportData() {
    const raw = state.raw || {};
    const out = {};
    if (raw._schema) out._schema = raw._schema;
    if (raw._paste_note) out._paste_note = raw._paste_note;
    out.asOf = state.asOf || null;
    out.posture = state.posture || null;
    out.anchor = state.anchor;

    const byId = {};
    state.items.forEach(i => { byId[i.id] = i; });
    const seen = {};
    const rows = [];

    ((raw.rows) || []).forEach(orig => {
      const item = byId[orig.id];
      if (!item) { rows.push(orig); return; }
      seen[orig.id] = true;
      rows.push(rowFor(orig, item));
    });
    state.items.forEach(i => { if (!seen[i.id]) rows.push(rowFor(null, i)); });

    out.rows = rows;
    return out;
  }

  function rowFor(orig, item) {
    const row = Object.assign({}, orig || { id: item.id, class: item.cls });
    const eff = TW.effStatus(item, state.anchor);
    row.value = item.value != null && item.value !== "" ? String(item.value) : null;
    row.status = eff.s || null;
    row.proposed_status = item.proposed_status || null;
    row.rationale = item.rationale || item.note || null;
    row.confidence = item.confidence || null;
    row.citation = item.citation || null;
    row.as_of = item.as_of || null;
    row.next_release = item.next_release || null;
    return row;
  }

  return {
    state, load, reload, build, find, setFields, setMeta, clearLocal,
    localCount, applyPayload, exportData, persistOk, MUTABLE, DATA_URL
  };
})();
