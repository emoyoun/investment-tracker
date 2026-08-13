/* Static definitions for the Tripwire Console.
 *
 * This file owns everything that does NOT change day to day: names, sleeves,
 * amber/red conditions, guardrails, confirm sequences, triggers, and the
 * seed reading each row falls back to before data.json supplies one.
 *
 * The mutable half — value, status, proposed_status, rationale, confidence,
 * citation, as_of, next_release — lives in data.json and overrides `seed`.
 */
"use strict";

window.TRIPWIRE_DEFS = {

  meta: {
    seedAsOf: "2026-07-31 (seed)",
    seedPosture:
      "Tier-1 tripwires CLEAR except Correlation-regime AMBER (stock\u2013bond break) \u00b7 " +
      "30Y at fiscal-dominance confirmation edge (~5.20) \u00b7 SOX ladder \u221220/\u221225 fired, " +
      "Bucket C armed at \u221230% ($459.20)."
  },

  /* Default deployment-ladder anchor. data.json `anchor` overrides this. */
  anchor: {
    soxx_peak: 656,
    rungs: { minus20: 524.80, minus25: 492.00, minus30_bucketC: 459.20, minus40: 393.60 }
  },

  playbook: [
    "<b>A trip = re-underwrite that pillar, not an automatic sell.</b> Ask whether the thesis for the pillar changed, or whether this is price/sentiment noise. Only a genuine thesis break warrants trimming the sleeve.",
    "<b>One trip \u2260 abandon the barbell.</b> The structure is built so one leg can fail while the other works. A single tripped pillar is a reason to reduce that pillar, not to dismantle the structure.",
    "<b>Distinguish drift from breakage.</b> This is why the tripwires are written in business metrics rather than prices. A de-rated stock on intact fundamentals is opportunity; a deteriorating fundamental is the warning.",
    "<b>Escalate deliberately.</b> WATCH means check more often (monthly \u2192 biweekly). RED means re-underwrite within the quarter and decide on sleeve sizing.",
    "<b>Remember the real ballast.</b> In a broad liquidity shock several pillars can trip at once, and the protection then is cash plus physical gold \u2014 not the barbell. Don't expect the tripwires to save you from a correlated crash; that is what the cash reserve and gold are for.",
    "<b>Cadence.</b> Monthly self-check for the macro tripwires (inflation regime, gold floor) plus a glance at crypto/miner financing. Earnings-season deep check four times a year for the capex and software tripwires. Weekly is unnecessary \u2014 the data doesn't move that fast, and weekly checking re-exposes you to the noise this framework is designed to ignore."
  ],

  sections: [

    /* ---------------- Tier 1 ---------------- */
    {
      kind: "tier",
      label: "Tier 1 \u2014 Action Tripwires",
      title: "Action Tripwires",
      sub: "trip \u2192 re-underwrite &amp; trim that sleeve",
      items: [

        {
          id: "tw1", idx: "01", cls: "event",
          name: "AI / compute-bottleneck",
          sleeve: "watches <b>TSM ASML AMAT LRCX KLAC AMD MU SKHY AVGO ANET CEG GEV FN STRL</b> \u00b7 ~22% of book",
          amber: {
            cond: "AI credit stress (hyperscaler/neocloud CDS or bond spreads widening) <b>and</b> compute/memory pricing rolling over together. Sub-signals: CoWoS availability opening, circular/vendor financing expanding, token-cost deflation accelerating.",
            act: "Stop adding to semis; biweekly watch. Amber is \u201cstop adding\u201d, not \u201cstart cutting\u201d."
          },
          red: {
            cond: "Two or more of <b>MSFT / GOOGL / AMZN / META</b> guide capex <b>down year-over-year</b> \u2014 an actual cut.",
            act: "Confirm structural, cross-check, trim proportionally. Never a full exit on one print."
          },
          guardrail: "Not a trip: slower growth, digestion, one soft print, or capex softening while GPU/DRAM prices are still rising.",
          confirm: [
            "<b>Confirm it's structural, not digestion</b> \u2014 genuinely 2+ hyperscalers guiding down, or one company's timing quirk / completed build phase?",
            "<b>Cross-check corroboration</b> \u2014 a real demand break echoes across the amber signals: GPU rental prices falling, DRAM/HBM rolling over, token growth decelerating, credit stress biting.",
            "<b>Trim the pillar, not the portfolio</b> \u2014 reduce the semis/AI-power sleeve toward the low end of its band. Leave energy, gold, core and software untouched.",
            "<b>Scale the response to severity</b> \u2014 mild confirmed deceleration trims to the bottom of the band; a broad capex collapse with all corroborating signals warrants a deeper cut."
          ],
          cadence: "earnings season (Jan / Apr / Jul / Oct)",
          source: "Hyperscaler earnings \u00b7 Reuters/BBG/FT",
          seed: {
            status: "clear", value: "capex guides up; pricing firm",
            note: "Hyperscaler capex still rising; HBM/DRAM tight.",
            confidence: "medium", citation: "", next_release: "quarterly earnings"
          }
        },

        {
          id: "tw2", idx: "02", cls: "filing",
          name: "Gold / hard-asset floor",
          sleeve: "watches <b>physical gold</b>, <b>AEM</b> \u00b7 scarcity thesis",
          red: {
            cond: "Central banks shift from net buying to <b>sustained net selling</b> of gold \u2014 a durable reversal, not one country for one month.",
            act: "Re-underwrite the hard-asset floor."
          },
          guardrail: "Not a trip: ETF outflows, a falling price, or a strong-dollar month. Watch official-sector <b>buying</b>, not flows or price.",
          cadence: "monthly \u00b7 quarterly WGC report",
          source: "World Gold Council",
          series_id: "WGC net purchases",
          seed: {
            status: "clear", value: "official sector net buyer",
            note: "Central-bank demand remains the structural bid.",
            confidence: "medium", citation: "", as_of: "2026-Q2 (seed)", next_release: "2026-Q3 WGC report"
          }
        },

        {
          id: "tw3", idx: "03", cls: "live",
          name: "Structural-inflation / regime",
          sleeve: "watches the assumption under the whole scarcity leg",
          red: {
            cond: "Core PCE <b>\u2264 ~2% for 2\u20133 consecutive quarters</b> while real policy rates positive <b>and</b> real yields falling.",
            act: "Re-underwrite the scarcity leg; barbell tilts back to productivity."
          },
          guardrail: "Not a trip: one cool print; oil-driven disinflation that's already fading; inflation falling <b>with</b> rate cuts (that's debasement, which supports the thesis). The trip is disinflation <b>and</b> positive real rates together.",
          cadence: "monthly",
          source: "FRED \u00b7 BEA",
          series_id: "PCEPILFE + DFII10",
          seed: {
            status: "clear", value: "Core PCE YoY > 2%",
            note: "Regime intact; debasement path base case.",
            confidence: "high", citation: "", next_release: "monthly (BEA PCE)"
          }
        },

        {
          id: "tw4", idx: "04", cls: "event",
          name: "Software / compounder moat",
          sleeve: "watches <b>CSU NOW CRM SAP TOI SNOW SHOP</b> \u00b7 plus ISRG",
          red: {
            cond: "Sustained organic growth <b>below ~10\u201312%</b> across core compounders, <b>or</b> a structural fall in net revenue retention.",
            act: "Re-underwrite the software sleeve; separate moat erosion from cyclicality."
          },
          guardrail: "Not a trip: a de-rated multiple on stable fundamentals (that's opportunity); one soft quarter; a slower-ramping large deal. Watch the business metrics, not the stock price.",
          cadence: "earnings season \u00b7 CSU/NOW/CRM watched closest",
          source: "Company earnings \u00b7 secondary",
          seed: {
            status: "clear", value: "organic growth & NRR holding",
            note: "Evidence AI agents compressing seat economics = the thing to watch.",
            confidence: "medium", citation: "", next_release: "quarterly earnings"
          }
        },

        {
          id: "tw5", idx: "05", cls: "event",
          name: "Speculative / digital-scarcity",
          sleeve: "watches <b>BTDR IREN KEEL BITB ETHQ SOLQ</b>",
          red: {
            cond: "Forced/systemic selling in the crypto-treasury/miner complex, <b>or</b> a held miner needing <b>serial equity dilution beyond a set pace</b> \u2014 right on the asset, losing on the equity.",
            act: "Trim; the 9% cap bounds the damage. Watch IREN financing mix closest."
          },
          guardrail: "Not a trip: normal Bitcoin volatility; a single capital raise; a price drawdown with no financing or dilution problem.",
          cadence: "monthly glance at financing",
          source: "Filings \u00b7 secondary",
          seed: {
            status: "clear", value: "no forced selling",
            note: "BTDR held as named leverage exception; IREN dilution sized for.",
            confidence: "medium", citation: "", next_release: "event-driven"
          }
        },

        {
          id: "tw6", idx: "06", cls: "live",
          name: "Correlation regime \u2192 Bucket C signal",
          sleeve: "<b>cross-portfolio</b> \u2014 protects the whole book",
          amber: {
            cond: "Index vol uncompressing off a pinned regime; single-name dispersion collapsing toward correlation; credit/liquidity stress broadening <b>across</b> rather than within sectors; disorderly USD/JPY spike.",
            act: "Raise alertness; do not chase. Treat clustered signals as the trigger, never a single one."
          },
          guardrail: "Action is inverted from every other tripwire \u2014 see below. Bucket C deploy trigger: correlation event, or SOXX \u221230%. Not a trip: the calm, dispersed, index-pinned state itself \u2014 that's the setup, and it's benign while it lasts.",
          ballast: "<b>Protect the ballast.</b> Do NOT deploy cash or trim gold into the transition. A genuine correlated crash is the signal to <b>deploy Bucket C</b>, not to have pre-spent it.",
          cadence: "monthly \u00b7 biweekly once amber",
          source: "VIX \u00b7 DGS10 vs SPX \u00b7 USDJPY",
          series_id: "VIXCLS, DGS10, DEXJPUS",
          seed: {
            status: "amber", value: "stock\u2013bond correlation breaking; VIX low",
            note: "Treasuries selling with equities \u2014 Nemeth regime signal. Ballast intact.",
            confidence: "high", citation: "", next_release: "daily"
          }
        },

        {
          id: "tw7", idx: "07", cls: "filing",
          name: "Monetization / yield-cap regime",
          sleeve: "fires here \u2192 <b>gold-weight on the table</b>",
          amber: {
            cond: "<b>Tier 1 (any one):</b> explicit YCC / yield target \u00b7 non-crisis QE (WALCL expands while core PCE &gt; target, no crisis) \u00b7 SLR exemption or captive-demand rule. <b>Tier 2 (need 2+):</b> bill share &gt; ~25% of marketable debt \u00b7 stablecoin bill demand scaling.",
            act: "Put gold-weight on the table."
          },
          guardrail: "Falsifiers: DFII10 durably positive \u00b7 fiscal consolidation (primary deficit) \u00b7 Volcker-style hike into weakness \u00b7 active 3-dissent hawk bloc.",
          cadence: "FOMC \u00b7 quarterly QRA",
          source: "FOMC \u00b7 H.4.1/WALCL \u00b7 QRA/MSPD \u00b7 GENIUS",
          series_id: "WALCL",
          seed: {
            status: "clear", value: "no Tier-1 fire; hawk bloc active",
            note: "9-3 hold with 3 dissents argues against fiscal dominance for now.",
            confidence: "medium", citation: "", next_release: "FOMC + quarterly QRA"
          }
        },

        {
          id: "tw8", idx: "08", cls: "event",
          name: "China semicap moat",
          sleeve: "structural, multi-year \u2014 watches <b>ASML AMAT LRCX KLAC MU</b>",
          red: {
            cond: "<b>ASML:</b> credible Chinese EUV &gt;80\u201390% yield in volume pre-2030. <b>AMAT/LRCX:</b> China etch/dep share crosses ~60%, or tool-of-record at a leading-edge fab. <b>KLA (canary):</b> China process-control share crosses ~20%. <b>MU:</b> CXMT ships HBM3E/4 to a major vendor, or China HBM &gt;10% of global bits.",
            act: "Re-underwrite the exposed name; KLA metrology share is the leading tell."
          },
          guardrail: "Event-driven, no daily feed \u2014 confirmed from filings and industry reports when it happens.",
          cadence: "event-driven",
          source: "Filings \u00b7 industry reports \u00b7 secondary",
          seed: {
            status: "clear", value: "no displacement confirmed; EUV moat intact",
            note: "NAURA/AMEC share gains: AMAT most exposed, LRCX moderate, ASML intact through early 2030s.",
            confidence: "medium", citation: "", next_release: "event-driven"
          }
        }
      ]
    },

    /* ---------------- Tier 2 — rates ---------------- */
    {
      kind: "rates",
      label: "Tier 2 \u2014 Context Panels",
      title: "Rates &amp; fiscal-dominance",
      sub: "read to interpret \u00b7 all FRED daily",
      items: [
        {
          id: "r-dgs2", cls: "live", name: "2-yr yield", series_id: "DGS2", source: "FRED",
          trigger: "Sustained &gt; 4.25% \u2192 Donnelly falsified (structural repricing)",
          derive: n => n > 4.25
            ? { status: "amber", why: "2Y above 4.25% \u2014 Donnelly peak-hawkishness read under pressure" }
            : { status: "clear", why: "2Y at or below the 4.25% falsification line" },
          seed: { status: "clear", value: "~4.20%", citation: "", next_release: "daily" }
        },
        {
          id: "r-dgs30", cls: "live", name: "30-yr yield", series_id: "DGS30", source: "FRED",
          trigger: "&gt; 5.2% confirm (fiscal dominance) \u00b7 &gt; 6% disorderly (vigilante tail)",
          derive: n => n > 6
            ? { status: "red", why: "30Y above 6% \u2014 disorderly / bond-vigilante tail" }
            : n >= 5.2
              ? { status: "amber", why: "30Y at or above 5.2% \u2014 fiscal-dominance confirmation edge" }
              : { status: "clear", why: "30Y below the 5.2% confirmation line" },
          seed: { status: "amber", value: "~5.20%", citation: "", next_release: "daily" }
        },
        {
          id: "r-dgs10", cls: "live", name: "10-yr yield", series_id: "DGS10", source: "FRED",
          trigger: "Context / term-premium reference",
          seed: { status: "clear", value: "~4.64%", citation: "", next_release: "daily" }
        },
        {
          id: "r-dfii10", cls: "live", name: "10-yr real yield", series_id: "DFII10", source: "FRED",
          trigger: "Turns negative \u2192 repression live \u00b7 sharp spike \u2192 gold headwind",
          derive: n => n < 0
            ? { status: "amber", why: "10Y real yield negative \u2014 financial repression live" }
            : { status: "clear", why: "10Y real yield positive \u2014 repression falsifier holding" },
          seed: { status: "clear", value: "positive / elevated", citation: "", next_release: "daily" }
        },
        {
          id: "r-dff", cls: "live", name: "Fed funds", series_id: "DFF", source: "FRED",
          trigger: "Actual Sept hike \u2192 hawkish tail live (semis/spec pressure)",
          seed: { status: "clear", value: "3.50\u20133.75%", citation: "", next_release: "daily" }
        }
      ]
    },

    /* ---------------- Credit stress ---------------- */
    {
      kind: "rates",
      label: "Credit & dollar plumbing",
      title: "Credit stress",
      sub: "regime &amp; cross-check \u00b7 leads equities, not an exit trigger",
      items: [
        {
          id: "cr-hy-oas", cls: "live", name: "HY OAS", series_id: "BAMLH0A0HYM2", source: "FRED",
          trigger: "Confirmer \u00b7 \u2265 3.75% risk-off underway \u00b7 \u2265 5% serious stress",
          derive: n => n >= 5
            ? { status: "red", why: "HY OAS \u2265 5% \u2014 serious credit stress" }
            : n >= 3.75
              ? { status: "amber", why: "HY OAS \u2265 3.75% \u2014 risk-off underway" }
              : { status: "clear", why: "HY OAS below 3.75% \u2014 spreads complacent" },
          seed: { status: "clear", value: "~2.80%", citation: "", next_release: "daily" }
        },
        {
          id: "cr-ig-oas", cls: "live", name: "IG OAS", series_id: "BAMLC0A0CM", source: "FRED",
          trigger: "Core credit \u00b7 \u2265 1.25% amber \u00b7 red if \u2265 1.75% OR (\u2265 1.25% AND HY \u2265 4%) \u2014 stress migrating into quality",
          derive: (n, r) => {
            const hy = r && r["cr-hy-oas"];
            return (n >= 1.75 || (n >= 1.25 && hy >= 4.0))
              ? { status: "red", why: "IG OAS \u2265 1.75%, or \u2265 1.25% with HY \u2265 4% \u2014 stress migrating from junk into quality" }
              : n >= 1.25
                ? { status: "amber", why: "IG OAS \u2265 1.25% \u2014 core credit widening" }
                : { status: "clear", why: "IG OAS below 1.25% \u2014 core credit calm" };
          },
          seed: { status: "clear", value: "~0.80%", citation: "", next_release: "daily" }
        },
        {
          id: "cr-ccc-oas", cls: "live", name: "CCC OAS", series_id: "BAMLH0A3HYC", source: "FRED",
          trigger: "Riskiest tier, leads \u00b7 primary = BB\u2194CCC compression/reversal (weekly) \u00b7 absolute backstop red \u2265 12%",
          derive: n => n >= 12
            ? { status: "red", why: "CCC OAS \u2265 12% \u2014 absolute distress backstop" }
            : null,
          seed: { status: "clear", value: "~7%", citation: "", next_release: "daily" }
        },
        {
          id: "cr-divergence", cls: "event", name: "Credit\u2013equity divergence", series_id: null,
          source: "derived \u00b7 spreads vs equity sleeves",
          trigger: "Early warning: spreads widening while equity sleeves near highs \u2014 credit seeing what equity hasn't priced",
          seed: { status: "clear", value: "aligned", citation: "", next_release: "weekly" }
        },
        {
          id: "cr-ai-infra", cls: "event", name: "AI-infra issuer spreads / CDS", series_id: null,
          source: "credit feed / CDX HY proxy \u00b7 Oracle, CoreWeave, hyperscaler/neocloud",
          trigger: "Most thesis-relevant: widening &amp; sustained = real deterioration (don't add) \u00b7 calm during a semis selloff = mechanical low to ladder into",
          seed: { status: "clear", value: "calm", citation: "", next_release: "weekly" }
        }
      ]
    },

    /* ---------------- Dollar & yen plumbing ---------------- */
    {
      kind: "rates",
      title: "Dollar &amp; yen plumbing",
      sub: "regime confirmation \u00b7 peak-USD / debasement",
      items: [
        {
          id: "fx-usdjpy", cls: "live", name: "USD/JPY", series_id: "DEXJPUS", source: "FRED",
          trigger: "Disorderly JPY strengthening (USD/JPY falling fast) = yen-carry unwind / deleveraging (Aug-2024). Judge on the move, not the level.",
          seed: { status: "clear", value: "~157", citation: "", next_release: "daily" }
        },
        {
          id: "fx-broad-usd", cls: "live", name: "Broad USD (DTWEXBGS)", series_id: "DTWEXBGS", source: "FRED",
          trigger: "Sustained down = peak-USD leg confirmed \u00b7 break higher = Donnelly-USD partially falsified. Judge on direction / rate-of-change, not absolute level.",
          seed: { status: "clear", value: "\u2014", citation: "", next_release: "daily" }
        },
        {
          id: "fx-intervention", cls: "event", name: "US\u2013Japan FX intervention", series_id: null,
          source: "news / event",
          trigger: "Repeat or escalation of FX intervention = peak-USD / debasement confirmed as active policy.",
          seed: { status: "watch", value: "1st since 2011 done", citation: "", next_release: "event-driven" }
        },
        {
          id: "fx-gold-real", cls: "event", name: "Gold vs real-yield decoupling", series_id: "GC=F + DFII10",
          source: "Yahoo GC=F \u00b7 FRED DFII10",
          trigger: "Gold rising while real yields high = debasement priced, gold thesis intact \u00b7 re-coupling down (gold falling with rising real yields) = debasement bid fading.",
          seed: { status: "clear", value: "decoupled up", citation: "", next_release: "weekly" }
        }
      ]
    },

    /* ---------------- Deployment ladder ---------------- */
    {
      kind: "ladder",
      title: "Deployment ladder",
      sub: "buy mechanism \u00b7 SOX vs pinned peak",
      items: [
        {
          id: "ladder-sox", cls: "live",
          name: "SOX drawdown vs peak",
          series_id: "^SOX / SOXX",
          source: "index / ETF quote",
          rungs: [
            { pct: 0.20, key: "minus20",          label: "Bucket B rung 1" },
            { pct: 0.25, key: "minus25",          label: "Bucket B rung 2 \u2014 deploy pre-set tranche" },
            { pct: 0.30, key: "minus30_bucketC",  label: "Bucket C \u2014 broad dislocation" },
            { pct: 0.40, key: "minus40",          label: "Deep-dislocation reference" }
          ],
          seed: { status: "amber", value: "\u2248 \u221225% (seed)", citation: "", next_release: "daily" }
        }
      ]
    },

    /* ---------------- Scorecard ---------------- */
    {
      kind: "scorecard",
      title: "Macro-thinker scorecard",
      sub: "falsifiable frameworks \u00b7 cross-refs the tripwires",
      items: [
        { id: "sc-donnelly",   cls: "event", name: "Donnelly",   tag: "peak-hawkishness / peak-USD",
          marker: "Falsify: 2Y sustained > 4.25% + USD breaking higher, not lower",
          source: "your read \u00b7 secondary", seed: { status: "amber", citation: "" } },
        { id: "sc-karsan",     cls: "event", name: "Karsan",     tag: "structural debasement",
          marker: "Falsify: Fed tightens into disinflation & holds; real yields break out with no repression",
          source: "your read \u00b7 secondary", seed: { status: "clear", citation: "" } },
        { id: "sc-nemeth",     cls: "event", name: "Nemeth",     tag: "correlation-to-one",
          marker: "Falsify: diversification holds through a deleveraging (bonds rally as equities fall)",
          source: "your read \u00b7 secondary", seed: { status: "amber", citation: "" } },
        { id: "sc-baker",      cls: "event", name: "Baker",      tag: "margin migration",
          marker: "Falsify: value stays at the model layer; open-weights fail to commoditize",
          source: "your read \u00b7 secondary", seed: { status: "clear", citation: "" } },
        { id: "sc-rozencwajg", cls: "event", name: "Rozencwajg", tag: "capex / scarcity",
          marker: "Falsify: oil supply surprises to the upside; backwardation fails to appear",
          source: "your read \u00b7 secondary", seed: { status: "clear", citation: "" } },
        { id: "sc-warsh",      cls: "event", name: "Warsh",      tag: "credibility / good-cop",
          marker: "Falsify: committee acts on a real, sustained hawkish hike path",
          source: "your read \u00b7 secondary", seed: { status: "clear", citation: "" } }
      ]
    },

    /* ---------------- Compliance ---------------- */
    {
      kind: "compliance",
      title: "Compliance / screening",
      sub: "continuous \u00b7 Shariah screens",
      items: [
        { id: "c-leverage", cls: "event", name: "Leverage screen", tag: "~33% debt / market-cap",
          marker: "Any holding crossing the line. BTDR (~50\u201355%) & IREN = named exceptions.",
          source: "filings", seed: { status: "clear", citation: "" } },
        { id: "c-screens", cls: "event", name: "Four active screens", tag: "new additions",
          marker: "riba/leverage \u00b7 ownership-vs-speculation \u00b7 military-product \u00b7 Israel MoD direct-customer",
          source: "your ruling", seed: { status: "clear", citation: "" } },
        { id: "c-wshr", cls: "filing", name: "WSHR purification", tag: "corporate account",
          marker: "Check T3 income character (interest income requiring purification).",
          source: "fund disclosure / T3 slip", seed: { status: "watch", citation: "", next_release: "annual T3" } }
      ]
    }
  ]
};
