/* Rendering. Definition text is trusted static HTML; every value that can come
 * from data.json or the paste box is escaped, and citations are link-rendered
 * only when they parse as http(s). */
"use strict";

window.Render = (function () {

  const TW = window.TW;
  const esc = TW.esc;
  const $ = id => document.getElementById(id);

  let refresh = function () {};
  let notify = function () {};
  function init(o) { refresh = o.refresh; notify = o.notify; }

  const STATUS_LABEL = { red: "Red \u00b7 trip", amber: "Amber \u00b7 warning", watch: "Watch", clear: "Clear" };
  const STATUS_ORDER = ["red", "amber", "watch", "clear"];

  /* ---------------- filtering ---------------- */

  function haystack(it) {
    return [it.name, it.idx, it.series_id, it.source, it.value, it.note, it.rationale,
            it.tag, it.marker, it.cls, it.cadence,
            it.sleeve, it.trigger,
            it.amber && it.amber.cond, it.red && it.red.cond]
      .filter(Boolean)
      .join(" ")
      .replace(/<[^>]*>/g, " ")
      .toLowerCase();
  }

  function needsAttention(it, anchor) {
    const s = TW.effStatus(it, anchor).s;
    if (s === "red" || s === "amber" || s === "watch") return true;
    if (it.proposed_status && it.proposed_status !== it.status) return true;
    if (TW.ageFlag(it.as_of).stale) return true;
    return false;
  }

  function matches(it, f, anchor) {
    if (f.status.size && !f.status.has(TW.effStatus(it, anchor).s)) return false;
    if (f.cls.size && !f.cls.has(it.cls)) return false;
    if (f.flagged && !needsAttention(it, anchor)) return false;
    if (f.q && haystack(it).indexOf(f.q) === -1) return false;
    return true;
  }

  /* ---------------- small pieces ---------------- */

  function statusChip(it, anchor) {
    const eff = TW.effStatus(it, anchor);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip st-" + (eff.s || "none");
    b.textContent = eff.s ? (eff.unverified ? eff.s + " \u00b7unverified" : eff.s) : "unset";

    if (eff.auto) {
      b.classList.add("locked");
      b.title = "Derived: " + eff.why + "\nEdit the reading to change this status.";
      b.addEventListener("click", () => notify("\u201c" + it.name + "\u201d is derived from its reading \u2014 " + eff.why + ". Edit the reading to move it.", true));
      return b;
    }

    b.title = "Click to cycle status (clear \u2192 amber \u2192 red \u2192 watch)";
    b.addEventListener("click", () => {
      const i = TW.CYCLE.indexOf(it.status);
      const next = TW.CYCLE[(i + 1) % TW.CYCLE.length];
      window.Store.setFields(it.id, { status: next });
      refresh();
    });
    return b;
  }

  function classBadge(cls) {
    const m = { live: ["b-live", "LIVE"], filing: ["b-filing", "FILING"], event: ["b-event", "EVENT"] }[cls]
      || ["b-event", "\u2014"];
    return '<span class="badge ' + m[0] + '">' + m[1] + "</span>";
  }

  function srcLine(it) {
    const af = TW.ageFlag(it.as_of);
    const asof = af.seed
      ? '<span style="color:var(--faint)">as of ' + esc(it.as_of || "seed") + "</span>"
      : af.stale
        ? '<span class="stale">as of ' + esc(it.as_of) + " \u00b7 " + af.days + "d stale</span>"
        : "as of " + esc(it.as_of || "\u2014");

    const parts = [classBadge(it.cls)];
    if (it.source) parts.push(esc(it.source));
    if (it.series_id && it.source) parts.push(esc(it.series_id));
    else if (it.series_id) parts.push(esc(it.series_id));
    parts.push(asof);
    if (it.next_release) parts.push("next: " + esc(it.next_release));
    if (it.cadence) parts.push("check: " + esc(it.cadence));
    if (it.cls !== "live") parts.push('<span class="conf">conf ' + esc(it.confidence || "medium") + "</span>");

    const url = TW.safeUrl(it.citation);
    if (url) parts.push('<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">source \u2197</a>');
    else if (it.citation) parts.push('<span class="nocite">citation not a link</span>');
    else if (it.cls !== "live") parts.push('<span class="nocite">no citation</span>');

    if (it.origin === "local") parts.push('<span class="origin-local">local edit</span>');

    return '<div class="srcline">' + parts.join(" \u00b7 ") + "</div>";
  }

  /* contenteditable readout: Enter commits, Escape reverts. */
  function editable(text, onCommit, extraClass) {
    const s = document.createElement("span");
    s.className = "val" + (extraClass ? " " + extraClass : "");
    s.contentEditable = "true";
    s.spellcheck = false;
    s.setAttribute("role", "textbox");
    s.textContent = text == null ? "" : String(text);
    const original = s.textContent;
    s.addEventListener("blur", () => {
      const v = s.textContent.trim();
      if (v !== original) onCommit(v);
    });
    s.addEventListener("keydown", ev => {
      if (ev.key === "Enter") { ev.preventDefault(); s.blur(); }
      else if (ev.key === "Escape") { ev.preventDefault(); s.textContent = original; s.blur(); }
    });
    return s;
  }

  function condRow(tier, cls, d) {
    const el = document.createElement("div");
    el.className = "cond";
    el.innerHTML = '<span class="tier ' + cls + '">' + tier + '</span><div class="body">' +
      '<div class="cond-txt">' + d.cond + "</div>" +
      (d.act ? '<div class="cond-act">\u2192 ' + d.act + "</div>" : "") + "</div>";
    return el;
  }

  /* ---------------- masthead / summary ---------------- */

  function renderHead(st) {
    $("asOf").textContent = st.asOf || "\u2014";
    $("posture").textContent = st.posture || "\u2014";

    const feed = $("feed");
    const txt = $("feedText");
    feed.className = "feed";
    if (st.loadedFrom === "file" && !st.rawError) {
      const n = (st.raw && st.raw.rows ? st.raw.rows.length : 0);
      const filled = st.items.filter(i => i.origin !== "seed").length;
      feed.classList.add(filled ? "ok" : "warn");
      txt.textContent = filled
        ? "data.json loaded \u00b7 " + filled + " of " + st.items.length + " rows supplied"
        : "data.json loaded \u00b7 " + n + " rows, all values empty \u2014 showing seed";
    } else {
      feed.classList.add("err");
      txt.textContent = "data.json not loaded \u2014 showing seed";
    }
  }

  function renderBanner(st) {
    const b = $("banner");
    if (st.loadedFrom === "file" && !st.rawError) {
      const filled = st.items.filter(i => i.origin !== "seed").length;
      if (filled === 0) {
        b.hidden = false;
        b.innerHTML = "<b>data.json has no readings yet.</b> Every mutable field in the file is still " +
          "<code>null</code>, so the console is showing its built-in seed values. Fill in " +
          "<code>value</code>, <code>status</code>, <code>as_of</code> and <code>citation</code> " +
          "for the rows you have data for, then hit <b>Reload data</b>.";
        return;
      }
      b.hidden = true;
      return;
    }
    b.hidden = false;
    const fileProto = window.location.protocol === "file:";
    b.innerHTML = "<b>Could not read data.json" + (st.rawError ? " \u2014 " + esc(st.rawError.message) : "") + ".</b> " +
      (fileProto
        ? "Browsers block <code>fetch</code> on <code>file://</code> URLs, so opening index.html directly " +
          "cannot load the data file. Serve the folder instead \u2014 <code>npm start</code>, or " +
          "<code>python3 -m http.server 8080</code> \u2014 then open <code>http://localhost:8080</code>."
        : "Check that <code>data.json</code> sits next to <code>index.html</code> and is valid JSON.") +
      " Seed values are shown in the meantime; the paste box below still works.";
  }

  function renderTallies(st, f) {
    const counts = { clear: 0, amber: 0, red: 0, watch: 0 };
    st.items.forEach(it => {
      const s = TW.effStatus(it, st.anchor).s;
      if (counts[s] != null) counts[s]++;
    });
    const host = $("tallies");
    host.innerHTML = "";
    STATUS_ORDER.forEach(k => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tally";
      b.setAttribute("aria-pressed", f.status.has(k) ? "true" : "false");
      b.title = "Filter to " + k + " rows";
      b.innerHTML = '<div class="n c-' + k + '">' + counts[k] + '</div><div class="k">' + STATUS_LABEL[k] + "</div>";
      b.addEventListener("click", () => {
        f.status.has(k) ? f.status.delete(k) : f.status.add(k);
        refresh();
      });
      host.appendChild(b);
    });
  }

  function renderQueue(st) {
    const host = $("queue");
    const pending = st.items.filter(it => it.proposed_status && it.proposed_status !== it.status);
    if (!pending.length) {
      host.innerHTML = '<div class="queue empty"><h2>Action queue</h2>' +
        '<div class="sub" style="margin:0">Clear \u2014 no proposed changes awaiting your confirm.</div></div>';
      return;
    }
    const box = document.createElement("div");
    box.className = "queue";
    box.innerHTML = '<h2>Action queue <span class="warn">' + pending.length + " awaiting confirm</span></h2>" +
      '<div class="sub">The agent proposed these status moves. Accept to own the change, or dismiss it.</div>';

    pending.forEach(it => {
      const row = document.createElement("div");
      row.className = "qrow";
      const url = TW.safeUrl(it.citation);
      const cite = url
        ? '<div class="qcite"><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">source \u2197</a> \u00b7 conf ' + esc(it.confidence || "medium") + "</div>"
        : '<div class="qcite nocite">no citation \u2014 cannot confirm</div>';

      row.innerHTML = '<div class="qbody"><div class="qname">' + esc(it.name) + "</div>" +
        '<div class="qmove"><span class="pill st-' + (it.status || "none") + '">' + esc(it.status || "unset") + "</span>" +
        "<span>\u2192</span>" +
        '<span class="pill st-' + it.proposed_status + '">' + esc(it.proposed_status) + "</span></div>" +
        '<div class="qrat">' + esc(it.rationale || it.note || "\u2014") + "</div>" + cite + "</div>";

      const btns = document.createElement("div");
      btns.className = "qbtns";

      const acc = document.createElement("button");
      acc.className = "accept";
      acc.textContent = "Accept";
      acc.disabled = !url;
      if (!url) acc.title = "A citation is required before a proposed move can be confirmed.";
      acc.addEventListener("click", () => {
        window.Store.setFields(it.id, { status: it.proposed_status, proposed_status: null });
        notify("Accepted \u2014 " + it.name + " moved to " + it.proposed_status + ".", true);
        refresh();
      });

      const dis = document.createElement("button");
      dis.textContent = "Dismiss";
      dis.addEventListener("click", () => {
        window.Store.setFields(it.id, { proposed_status: null });
        notify("Dismissed the proposed move on " + it.name + ".", true);
        refresh();
      });

      btns.appendChild(acc);
      btns.appendChild(dis);
      row.appendChild(btns);
      box.appendChild(row);
    });

    host.innerHTML = "";
    host.appendChild(box);
  }

  /* ---------------- section bodies ---------------- */

  function panelEl(it, anchor) {
    const eff = TW.effStatus(it, anchor);
    const el = document.createElement("article");
    const pending = it.proposed_status && it.proposed_status !== it.status;
    el.className = "panel" + (pending ? " flagged" : "") +
      (eff.s === "red" ? " st-red-edge" : eff.s === "amber" ? " st-amber-edge" : "");

    const top = document.createElement("div");
    top.className = "top";
    top.innerHTML = '<div><div class="idx">' + esc(it.idx || "") + "</div>" +
      '<div class="name">' + esc(it.name) + "</div>" +
      '<div class="sleeve">' + (it.sleeve || "") + "</div></div>";

    const chips = document.createElement("div");
    chips.className = "chiprow";
    chips.appendChild(statusChip(it, anchor));
    if (pending) {
      const p = document.createElement("span");
      p.className = "prop";
      p.textContent = "\u2192 " + it.proposed_status + "?";
      chips.appendChild(p);
    }
    top.appendChild(chips);
    el.appendChild(top);

    if (it.amber) el.appendChild(condRow("Amber", "tier-amber", it.amber));
    if (it.red) el.appendChild(condRow("Red", "tier-red", it.red));

    if (it.guardrail) {
      const g = document.createElement("div");
      g.className = "guardrail";
      g.innerHTML = it.guardrail;
      el.appendChild(g);
    }
    if (it.ballast) {
      const b = document.createElement("div");
      b.className = "ballast";
      b.innerHTML = it.ballast;
      el.appendChild(b);
    }
    if (it.confirm && it.confirm.length) {
      const d = document.createElement("details");
      d.className = "confirm";
      d.innerHTML = "<summary>Confirm \u2192 act sequence</summary><ol>" +
        it.confirm.map(s => "<li>" + s + "</li>").join("") + "</ol>";
      el.appendChild(d);
    }

    const ro = document.createElement("div");
    ro.className = "readout";
    ro.innerHTML = '<span class="rk">Reading</span>';
    ro.appendChild(editable(it.value, v => { window.Store.setFields(it.id, { value: v }); refresh(); }));
    el.appendChild(ro);

    const note = document.createElement("div");
    note.className = "pnote";
    note.appendChild(editable(it.note || it.rationale || "", v => { window.Store.setFields(it.id, { note: v }); refresh(); }));
    el.appendChild(note);

    el.insertAdjacentHTML("beforeend", srcLine(it));
    return el;
  }

  function ratesEl(items, anchor) {
    const w = document.createElement("div");
    w.className = "rates";
    const head = document.createElement("div");
    head.className = "rrow head";
    head.innerHTML = '<div class="rhead">Series</div><div class="rhead">Reading</div>' +
      '<div class="rhead">Trigger</div><div class="rhead">Status</div>';
    w.appendChild(head);

    items.forEach(it => {
      const r = document.createElement("div");
      r.className = "rrow";
      r.innerHTML = '<div class="rname">' + esc(it.name) + "<span>" + esc(it.series_id || "") + "</span></div>";

      const v = document.createElement("div");
      v.className = "rval";
      v.appendChild(editable(it.value, x => { window.Store.setFields(it.id, { value: x }); refresh(); }));
      const af = TW.ageFlag(it.as_of);
      const meta = document.createElement("div");
      meta.className = "rmeta";
      meta.innerHTML = af.seed ? "seed" : (af.stale
        ? '<span class="stale">' + esc(it.as_of) + " \u00b7 " + af.days + "d</span>"
        : esc(it.as_of || ""));
      v.appendChild(meta);
      r.appendChild(v);

      r.insertAdjacentHTML("beforeend", '<div class="rtrig">' + (it.trigger || "") + "</div>");

      const c = document.createElement("div");
      c.className = "rstatus";
      c.appendChild(statusChip(it, anchor));
      const eff = TW.effStatus(it, anchor);
      if (eff.auto) {
        const a = document.createElement("span");
        a.className = "auto";
        a.textContent = "auto";
        a.title = eff.why;
        c.appendChild(a);
      }
      r.appendChild(c);
      w.appendChild(r);
    });
    return w;
  }

  function ladderEl(it, anchor) {
    const el = document.createElement("div");
    el.className = "ladder";
    const peak = TW.parseNum(anchor && anchor.soxx_peak);
    const rungs = TW.ladderRungs(it, anchor);
    const dd = TW.ladderDrawdown(it, anchor);

    const head = document.createElement("div");
    head.className = "lhead";
    head.innerHTML = '<div class="lname">' + esc(it.name) +
      " <span>" + esc(it.series_id || "") + " \u00b7 peak $" + (peak ? peak.toFixed(2) : "\u2014") + "</span></div>";
    const cur = document.createElement("div");
    cur.className = "lcur";
    cur.append("current: ");
    cur.appendChild(editable(it.value, v => { window.Store.setFields(it.id, { value: v }); refresh(); }));
    head.appendChild(cur);
    el.appendChild(head);

    const SCALE = 0.50;
    const meter = document.createElement("div");
    meter.className = "meter";
    const pct = dd ? Math.min(dd.pct / SCALE, 1) : 0;
    meter.innerHTML = '<div class="fill" style="width:' + (pct * 100).toFixed(1) + '%"></div>' +
      rungs.map(r => '<div class="tick' + (dd && dd.pct >= r.pct - 1e-9 ? " fired" : "") +
        '" style="left:' + ((r.pct / SCALE) * 100).toFixed(1) + '%"></div>').join("");
    el.appendChild(meter);

    const scale = document.createElement("div");
    scale.className = "meter-scale";
    scale.innerHTML = "<span>peak</span><span>" +
      (dd ? "drawdown " + (dd.pct * 100).toFixed(1) + "%" +
            (dd.from === "price" ? " (from $" + dd.price.toFixed(2) + ")" : "")
          : "drawdown unreadable \u2014 enter a % or an index level") +
      "</span><span>\u221250%</span>";
    el.appendChild(scale);

    const rw = document.createElement("div");
    rw.className = "rungs";
    let nextMarked = false;
    rungs.forEach(r => {
      const fired = dd ? dd.pct >= r.pct - 1e-9 : false;
      const isNext = !fired && !nextMarked && !!dd;
      if (isNext) nextMarked = true;
      const row = document.createElement("div");
      row.className = "rung" + (isNext ? " next" : "");
      row.innerHTML =
        '<div class="rpct" style="color:' + (fired ? "var(--red)" : "var(--cyan)") + '">\u2212' +
          Math.round(r.pct * 100) + "%</div>" +
        '<div><span class="rprice">$' + r.price.toFixed(2) + '</span> <span class="rlabel">\u2014 ' +
          esc(r.label) + (isNext ? " \u00b7 next rung" : "") + "</span></div>" +
        '<div class="rstate ' + (fired ? "rs-fired" : "rs-armed") + '">' + (fired ? "fired" : "armed") + "</div>";
      rw.appendChild(row);
    });
    el.appendChild(rw);
    el.insertAdjacentHTML("beforeend", srcLine(it));
    return el;
  }

  function rowsEl(items, anchor) {
    const w = document.createElement("div");
    w.className = "rows";
    items.forEach(it => {
      const r = document.createElement("div");
      r.className = "lrow";
      r.innerHTML = '<div class="ln">' + esc(it.name) + "<span>" + esc(it.tag || "") + "</span></div>" +
        '<div class="lm">' + esc(it.marker || "") + "</div>";
      const c = document.createElement("div");
      c.className = "lstatus";
      c.appendChild(statusChip(it, anchor));
      if (it.proposed_status && it.proposed_status !== it.status) {
        const p = document.createElement("span");
        p.className = "prop";
        p.textContent = "\u2192 " + it.proposed_status + "?";
        c.appendChild(p);
      }
      r.appendChild(c);
      w.appendChild(r);
    });
    return w;
  }

  /* ---------------- top level ---------------- */

  function renderSections(st, f) {
    const host = $("sections");
    host.innerHTML = "";
    let shown = 0;

    st.sections.forEach(sec => {
      const items = sec.items.filter(it => matches(it, f, st.anchor));
      if (!items.length) return;
      shown += items.length;

      if (sec.label) {
        const t = document.createElement("div");
        t.className = "tier-label";
        t.textContent = sec.label;
        host.appendChild(t);
      }
      const s = document.createElement("section");
      const hidden = sec.items.length - items.length;
      s.innerHTML = '<div class="sec-head"><h2 class="sec-title">' + sec.title + "</h2>" +
        '<span class="sec-sub">' + (sec.sub || "") +
        (hidden ? " \u00b7 " + hidden + " filtered out" : "") + "</span></div>";

      if (sec.kind === "tier") {
        const g = document.createElement("div");
        g.className = "grid";
        items.forEach(it => g.appendChild(panelEl(it, st.anchor)));
        s.appendChild(g);
      } else if (sec.kind === "rates") {
        s.appendChild(ratesEl(items, st.anchor));
      } else if (sec.kind === "ladder") {
        items.forEach(it => s.appendChild(ladderEl(it, st.anchor)));
      } else {
        s.appendChild(rowsEl(items, st.anchor));
      }
      host.appendChild(s);
    });

    $("emptyState").hidden = shown > 0;

    const active = [];
    if (f.q) active.push('text "' + f.q + '"');
    if (f.status.size) active.push("status " + Array.from(f.status).join("/"));
    if (f.cls.size) active.push("class " + Array.from(f.cls).join("/"));
    if (f.flagged) active.push("needs attention");
    const note = $("filterNote");
    if (active.length) {
      note.hidden = false;
      note.textContent = "Showing " + shown + " of " + st.items.length + " rows \u00b7 " + active.join(" \u00b7 ");
    } else {
      note.hidden = true;
    }
  }

  function all(st, f) {
    renderHead(st);
    renderBanner(st);
    renderTallies(st, f);
    renderQueue(st);
    renderSections(st, f);
  }

  return { init, all, STATUS_ORDER };
})();
