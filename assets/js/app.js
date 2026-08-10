/* Bootstrap and wiring. */
"use strict";

(function () {

  const TW = window.TW;
  const Store = window.Store;
  const Render = window.Render;
  const $ = id => document.getElementById(id);

  const filters = { q: "", status: new Set(), cls: new Set(), flagged: false };

  function refresh() {
    Render.all(Store.state, filters);
    renderPersistNote();
  }

  function notify(msg, ok) {
    const f = $("flash");
    f.textContent = msg;
    f.className = "flash " + (ok ? "ok" : "err");
  }

  function renderPersistNote() {
    const n = Store.localCount();
    const bits = [];
    if (!Store.persistOk()) bits.push("localStorage unavailable \u2014 edits last only for this session.");
    else if (n) bits.push(n + " row" + (n === 1 ? "" : "s") + " carry local edits, kept in this browser. They are dropped automatically when data.json supplies a newer reading for the same row.");
    else bits.push("No local edits \u2014 the console is showing data.json (or seed values) as-is.");
    $("persistNote").textContent = bits.join(" ");
    $("clearLocalBtn").disabled = n === 0;
  }

  /* ---------------- filter chips ---------------- */

  function buildFilterChips() {
    const mk = (host, keys, set) => {
      host.innerHTML = "";
      keys.forEach(k => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "fchip";
        b.dataset.k = k;
        b.textContent = k;
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", () => {
          set.has(k) ? set.delete(k) : set.add(k);
          b.setAttribute("aria-pressed", set.has(k) ? "true" : "false");
          refresh();
        });
        host.appendChild(b);
      });
    };
    mk($("statusFilters"), Render.STATUS_ORDER, filters.status);
    mk($("classFilters"), ["live", "filing", "event"], filters.cls);
  }

  function syncFilterChips() {
    document.querySelectorAll("#statusFilters .fchip").forEach(b => {
      b.setAttribute("aria-pressed", filters.status.has(b.dataset.k) ? "true" : "false");
    });
    document.querySelectorAll("#classFilters .fchip").forEach(b => {
      b.setAttribute("aria-pressed", filters.cls.has(b.dataset.k) ? "true" : "false");
    });
    $("flaggedBtn").setAttribute("aria-pressed", filters.flagged ? "true" : "false");
  }

  function clearFilters() {
    filters.q = "";
    filters.status.clear();
    filters.cls.clear();
    filters.flagged = false;
    $("search").value = "";
    syncFilterChips();
    refresh();
  }

  /* ---------------- events ---------------- */

  function wire() {
    buildFilterChips();

    $("search").addEventListener("input", e => {
      filters.q = e.target.value.trim().toLowerCase();
      refresh();
    });

    $("flaggedBtn").addEventListener("click", () => {
      filters.flagged = !filters.flagged;
      syncFilterChips();
      refresh();
    });

    $("clearFilters").addEventListener("click", clearFilters);

    $("reloadBtn").addEventListener("click", async () => {
      const btn = $("reloadBtn");
      btn.disabled = true;
      btn.textContent = "Reloading\u2026";
      await Store.reload();
      btn.disabled = false;
      btn.textContent = "Reload data";
      refresh();
      notify(Store.state.rawError
        ? "Reload failed \u2014 " + Store.state.rawError.message
        : "Reloaded data.json \u00b7 as of " + (Store.state.asOf || "\u2014") + ".",
        !Store.state.rawError);
    });

    $("applyBtn").addEventListener("click", () => {
      const raw = $("importBox").value.trim();
      if (!raw) { notify("Nothing to apply \u2014 paste a data.json payload first.", false); return; }
      let p;
      try { p = JSON.parse(raw); }
      catch (e) { notify("Invalid JSON \u2014 " + e.message, false); return; }

      let r;
      try { r = Store.applyPayload(p); }
      catch (e) { notify("Could not apply \u2014 " + e.message, false); return; }

      const bits = ["Applied " + r.applied + " row" + (r.applied === 1 ? "" : "s") + "."];
      if (r.diverted.length) bits.push("Red on Event row routed to your queue: " + r.diverted.join(", ") + ".");
      if (r.rejected.length) bits.push("Rejected, no citation: " + r.rejected.join(", ") + ".");
      if (r.overridden.length) bits.push("Status derived from the reading instead of the payload: " + r.overridden.join(", ") + ".");
      if (r.missed.length) bits.push("Unknown ids: " + r.missed.join(", ") + ".");
      refresh();
      notify(bits.join(" "), true);
      $("importBox").value = "";
    });

    $("exportBtn").addEventListener("click", async () => {
      const out = JSON.stringify(Store.exportData(), null, 2);
      try {
        await navigator.clipboard.writeText(out);
        notify("Copied \u2014 paste this over data.json to make the current state permanent.", true);
      } catch (e) {
        $("importBox").value = out;
        notify("Clipboard blocked \u2014 state dumped into the box above; copy it from there.", true);
      }
    });

    $("downloadBtn").addEventListener("click", () => {
      const out = JSON.stringify(Store.exportData(), null, 2);
      const blob = new Blob([out], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      notify("Downloaded data.json \u2014 replace the file in the repo to make it permanent.", true);
    });

    $("clearLocalBtn").addEventListener("click", () => {
      if (!Store.localCount()) return;
      if (!window.confirm("Discard all local edits and fall back to data.json?")) return;
      Store.clearLocal();
      refresh();
      notify("Local edits discarded.", true);
    });

    document.addEventListener("keydown", e => {
      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;
      if (e.key === "/" && !typing) { e.preventDefault(); $("search").focus(); }
      else if (e.key === "Escape" && tag === "input") { clearFilters(); }
    });
  }

  /* ---------------- clock ---------------- */

  function tick() {
    const d = new Date();
    const utc = d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
    $("now").textContent = utc;
    $("now").title = "Local: " + d.toLocaleString();
  }

  function renderPlaybook() {
    $("playbookBody").innerHTML = "<ol>" +
      window.TRIPWIRE_DEFS.playbook.map(s => "<li>" + s + "</li>").join("") + "</ol>";
  }

  /* ---------------- go ---------------- */

  Render.init({ refresh, notify });
  wire();
  renderPlaybook();
  tick();
  setInterval(tick, 30000);

  Store.load().then(() => {
    refresh();
    if (Store.state.rawError) {
      notify("data.json could not be read \u2014 see the banner above. Seed values are in use.", false);
    }
  }).catch(err => {
    notify("Startup failed \u2014 " + err.message, false);
    // eslint-disable-next-line no-console
    console.error(err);
  });

})();
