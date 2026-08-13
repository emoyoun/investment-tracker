/* Deterministic derivation + small shared helpers.
 *
 * data.json rule (1): "live/filing status is derived deterministically from
 * value vs trigger". Where a definition supplies a `derive(n)` rule and the
 * reading parses to a number, the derived status wins over anything the
 * payload asserts — the reading is the input, the status is the output.
 */
"use strict";

window.TW = (function () {

  const CYCLE = ["clear", "amber", "red", "watch"];
  const STALE_DAYS = 7;

  /* Cross-row readings, keyed by row id -> parsed number. Set by the store on
   * every build so a derive rule can reference OTHER rows (e.g. IG OAS escalating
   * to red when HY OAS is also wide). Single-argument derive rules ignore it. */
  let READINGS = {};
  function setReadings(map) { READINGS = map || {}; }

  /* Pull the first number out of a human reading: "~4.20%", "\u2248 \u221225% (seed)",
   * "3.50\u20133.75%" -> 4.2, -25, 3.5. Returns NaN when there is nothing numeric. */
  function parseNum(v) {
    if (typeof v === "number") return isFinite(v) ? v : NaN;
    if (v == null) return NaN;
    const s = String(v)
      .replace(/[\u2212\u2012\u2013\u2014\u2015]/g, "-")   // unicode minus / dashes
      .replace(/,/g, "");
    const m = s.match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  }

  function isSeed(as_of) {
    return !as_of || /seed/i.test(String(as_of));
  }

  /* Age of a reading. Handles "2026-08-10", "2026-Q2 (seed)", null. */
  function ageFlag(as_of) {
    if (isSeed(as_of)) return { seed: true };
    const d = Date.parse(as_of);
    if (isNaN(d)) return {};
    const days = Math.floor((Date.now() - d) / 864e5);
    return { days, stale: days > STALE_DAYS };
  }

  /* Resolve the ladder rungs against the live anchor: explicit prices from
   * data.json `anchor.rungs` win, otherwise price = peak * (1 - pct). */
  function ladderRungs(item, anchor) {
    const peak = parseNum(anchor && anchor.soxx_peak) || 0;
    const explicit = (anchor && anchor.rungs) || {};
    return (item.rungs || []).map(r => {
      const price = parseNum(explicit[r.key]);
      return {
        pct: r.pct,
        label: r.label,
        price: isNaN(price) ? +(peak * (1 - r.pct)).toFixed(2) : price
      };
    });
  }

  /* Current drawdown from the ladder reading. The reading may be expressed as
   * a percentage ("\u221225%") or as an index/ETF level ("492.00"). */
  function ladderDrawdown(item, anchor) {
    const peak = parseNum(anchor && anchor.soxx_peak);
    const raw = item.value;
    const n = parseNum(raw);
    if (isNaN(n)) return null;
    if (String(raw).indexOf("%") !== -1) return { pct: Math.abs(n) / 100, from: "percent" };
    if (!peak || peak <= 0 || n <= 0) return null;
    return { pct: Math.max(0, (peak - n) / peak), from: "price", price: n };
  }

  /* Derived status for the ladder: deepest breached rung sets the level. */
  function deriveLadder(item, anchor) {
    const dd = ladderDrawdown(item, anchor);
    if (!dd) return null;
    const rungs = ladderRungs(item, anchor);
    const fired = rungs.filter(r => dd.pct >= r.pct - 1e-9);
    const pctTxt = (dd.pct * 100).toFixed(1) + "%";
    if (!fired.length) {
      return { status: "clear", why: "Drawdown " + pctTxt + " \u2014 no rung breached" };
    }
    const deepest = fired[fired.length - 1];
    const status = deepest.pct >= 0.30 ? "red" : "amber";
    return {
      status,
      why: "Drawdown " + pctTxt + " \u2014 " + fired.length + " of " + rungs.length +
           " rungs fired, deepest \u2212" + Math.round(deepest.pct * 100) + "%"
    };
  }

  /* Returns {status, why} when a deterministic rule applies, else null. */
  function derived(item, anchor) {
    if (item.id === "ladder-sox") return deriveLadder(item, anchor);
    if (typeof item.derive !== "function") return null;
    const n = parseNum(item.value);
    if (isNaN(n)) return null;
    const out = item.derive(n, READINGS);
    return out && CYCLE.indexOf(out.status) !== -1 ? out : null;
  }

  /* Effective status, in precedence order:
   *   1. a deterministic derivation, when one applies
   *   2. the stored status
   * An Event row asserting red without a citation cannot render as tripped —
   * it degrades to amber and is marked unverified. */
  function effStatus(item, anchor) {
    const d = derived(item, anchor);
    if (d) return { s: d.status, auto: true, why: d.why };
    if (item.cls === "event" && item.status === "red" && !item.citation) {
      return { s: "amber", unverified: true };
    }
    return { s: item.status || null };
  }

  /* Only http(s) citations are ever turned into links. */
  function safeUrl(u) {
    if (!u) return null;
    try {
      const p = new URL(String(u), window.location.href);
      return (p.protocol === "http:" || p.protocol === "https:") ? p.href : null;
    } catch (e) { return null; }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { CYCLE, STALE_DAYS, parseNum, isSeed, ageFlag, ladderRungs, ladderDrawdown, derived, effStatus, safeUrl, esc, setReadings };
})();
