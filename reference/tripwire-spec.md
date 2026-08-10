# Tripwire Monitoring Dashboard

*Early-warning system for the Five-Year Thesis. Run this yourself on a schedule — it takes ~10–15 minutes. The point is a fast, repeatable ritual that replaces daily-news anxiety with a handful of specific signals. When a reminder fires, pull the readings, mark the status, and if anything trips, **re-underwrite the pillar — don't reflexively average down.** Note: tripwires #1–5 are pillar-specific (a trip → trim that sleeve); #6 is cross-portfolio (a trip → protect the ballast, don't deploy the cash reserve).*

**How to use with Claude:** whenever you check, paste your readings (or say "check my tripwires") in a new chat and Claude will pull current data, compare to thresholds, and tell you what's tripped or approaching. Claude cannot monitor in the background or notify you — the *pull* is yours; the *analysis* is Claude's.

---

## Cadence (matched to how fast each metric can actually move)

- **Monthly self-check** (~15 min): the two macro tripwires (inflation regime, gold floor) + a glance at crypto/miner financing. Set a recurring monthly phone reminder.
- **Earnings-season deep check** (4×/year, Jan / Apr / Jul / Oct): the three company/capex tripwires (AI capex, software moat, plus re-confirm the macro two). Set dated reminders around the prints below.
- **Weekly is unnecessary** — the data doesn't move that fast, and weekly checking re-exposes you to the noise the thesis is designed to ignore.

**Near-term dated reminders to set now:**
- SAP Q2 — **Jul 23** (cloud-deceleration: timing vs. trend)
- ServiceNow Q2 — **Jul 29** (Now Assist monetization; software-moat read)
- Hyperscaler capex prints — **late Jul** (MSFT/GOOGL/AMZN/META), then Oct, Jan, Apr
- SAP Celonis antitrust trial — **Dec 7**

---

## The Five Tripwires

### 1. AI / compute-bottleneck pillar
*Holdings at stake: TSM, ASML, AMAT/LRCX/KLAC, AMD, MU, SKHY, AVGO, ANET, CEG, GEV, FN, STRL (≈22% of the book)*

This pillar carries the largest single sleeve, so it uses a **two-stage** signal: an **amber early-warning** layer (leading indicators — act to pause, not sell) and the **red trip** (lagging confirmation — act to trim).

**🟠 AMBER — early warning (leading indicators).** Capex guidance is *lagging* — by the time hyperscalers guide down, the deceleration is already underway. These move first:
- **Metrics:** (a) AI credit stress — hyperscaler/neocloud CDS spreads and bond pricing widening materially (e.g., a Meta bond pricing poorly, spreads blowing out); **and** (b) compute/memory pricing rolling over — GPU rental rates and DRAM/HBM spot prices *falling together* after their run-up.
- **AMBER IF:** the financing stress **and** the pricing rollover appear **together** (either alone is noise — banks hedging, or normal spot softness). Together they suggest demand may be softening ahead of the capex print.
- **Action on amber:** **don't sell — pause and watch.** Halt any *new* deployment into the semis/AI-power sleeve, move the pillar to WATCH (check biweekly, not monthly), and pre-position for the red trip. Amber is "stop adding," not "start cutting."

**🔴 RED — the trip (lagging confirmation).**
- **Metric:** forward capex **guidance** from the four mega-cap hyperscalers (Microsoft, Alphabet, Amazon, Meta).
- **Source:** their quarterly earnings calls / releases (Jan, Apr, Jul, Oct).
- **TRIPS IF:** **two or more** guide capex **down year-over-year** — an actual reduction in the AI buildout, not a pause, digestion, or a single soft quarter.
- **Not a trip:** one company trimming; capex "growing more slowly"; a stock selling off on sentiment; capex softening while GPU/DRAM prices are *still rising* (that's digestion, not a demand break). Only *guided-down aggregate capex* counts.

**Confirm → act sequence when RED trips (this pillar is re-underwrite, NOT stop-loss — do not exit reflexively):**
1. **Confirm it's structural, not digestion** — is it genuinely 2+ hyperscalers *guiding down*, or one company's timing quirk / a completed build phase?
2. **Cross-check corroboration** — a real demand break echoes across the amber signals: GPU rental prices falling, DRAM/HBM rolling over, token growth decelerating, credit stress biting. If capex guides down *and* these confirm → thesis is breaking. If capex softens but GPU/memory prices stay firm → likely digestion, hold.
3. **If confirmed, trim the PILLAR, not the portfolio** — reduce the semis/AI-power sleeve toward the low end of its band or below. Leave energy, gold, core, and software untouched — one leg failing is what the barbell is *for*; the scarcity leg and cash are the ballast.
4. **Scale the response to severity** — mild confirmed deceleration → trim to the bottom of the band, pause redeployment. Severe, broad capex collapse with all corroborating signals → deeper cut. The trip says *the thesis is impaired*; the *degree* of action scales with the *degree and breadth* of confirmation. **Never a full one-shot exit on a single print.**

### 2. Gold / hard-asset pillar
*Holdings at stake: Gold, AEM (and the scarcity thesis broadly)*

- **Metric:** **central-bank net gold purchases** (official-sector demand).
- **Source:** World Gold Council — quarterly *Gold Demand Trends* + monthly central-bank reports; IMF/national reserve data.
- **TRIPS IF:** central banks shift to **sustained net selling** (a durable reversal, not one country one month).
- **Not a trip:** gold-ETF outflows, a falling gold price, or a strong-dollar month. The floor is official-sector buying — watch *that*, not flows or price.

### 3. Structural-inflation / regime pillar
*The macro assumption under the whole scarcity leg (energy, gold, resources, food, water)*

- **Metric:** Core PCE trend **and** the real policy rate (Fed funds minus core inflation).
- **Source:** BLS/BEA (PCE, monthly); Fed (policy rate). Free, released monthly.
- **TRIPS IF:** Core PCE holds **at or below ~2% target for 2–3 consecutive quarters** *while* real policy rates are **positive and real yields are falling** — i.e., durable disinflation with the old regime reasserting.
- **Not a trip:** one cool print; oil-driven disinflation that's already fading; inflation falling *with* rate cuts (that's the debasement path, which *supports* the thesis). The trip is disinflation + positive real rates *together*.

### 4. Software / productivity-compounder pillar
*Holdings at stake: CSU, NOW, CRM, SAP, TOI, SNOW, SHOP, plus ISRG*

- **Metric:** **organic revenue growth** and **net revenue retention (NRR)** of the core compounders — watch CSU, NOW, CRM most closely.
- **Source:** their quarterly reports (staggered; cluster around earnings season).
- **TRIPS IF:** sustained organic growth **below ~10–12%** across the core names, or a **structural fall in NRR** — evidence AI agents are genuinely compressing seat-based software economics (the moat eroding), not just multiples de-rating.
- **Not a trip:** a de-rated multiple on stable fundamentals (that's opportunity, not breakage); one soft quarter; a slower-ramping large deal. Watch the *business metrics*, not the stock price.

### 5. Speculative / digital-scarcity pillar
*Holdings at stake: BITB, ETHQ, SOLQ, BTDR, IREN, KEEL*

- **Metric:** Bitcoin level + **financing behavior** of the miners (share count, convertible issuance, dilution pace) and any crypto-treasury contagion.
- **Source:** company filings (share count/converts), crypto price, news on the crypto-treasury complex.
- **TRIPS IF:** **forced or systemic selling** in the crypto-treasury/miner complex, **or** a held miner requiring **serial equity dilution beyond a set pace** to fund its buildout (right on the asset, losing on the equity).
- **Not a trip:** normal Bitcoin volatility; a single capital raise; price drawdown without a financing/dilution problem.

### 6. Market-structure / correlation-regime watch *(cross-portfolio, not pillar-specific)*
*What's at stake: the entire book's "diversification." The barbell's hidden weakness is that its sleeves look uncorrelated in calm markets but move together in a liquidity/vol event. This tripwire watches for that transition. Its action is different from the others — it protects the ballast rather than trimming a pillar.*

- **The mechanic:** when index volatility is compressed and the index is pinned, volatility reappears as **dispersion** (names ripping/collapsing under a still index — the "big moves under the surface" of summer 2026, reportedly the highest dispersion in ~125 years). When that compression **releases**, the mechanic runs in reverse: dispersion collapses into **correlation-to-one** and everything falls together — exactly the scenario in which the barbell provides far less protection than the sleeve count implies.
- **Metrics (watch for the *transition*, not the calm state):** a sharp rise in index-level VIX/implied vol off compressed levels; realized index volatility expanding; single-name dispersion collapsing (the summer's idiosyncratic moves suddenly moving *together*); credit/liquidity stress broadening across, not within, sectors.
- **AMBER / WATCH IF:** index vol starts uncompressing off a pinned, low-vol regime — the potential energy is releasing. This is a *regime-change* watch, so it's inherently fuzzy; treat clustered signals (vol up + dispersion down + broad credit stress) as the trigger, not any single one.
- **ACTION (this is the key difference — NOT "trim a pillar"):** **protect the ballast.** Specifically: (a) **do not deploy the remaining cash reserve** into the transition; (b) **do not trim gold/physical or AEM** to chase equities; (c) recognize that in a correlated unwind, cash + physical gold are the *only* genuine protection — the barbell's other sleeves will move together. The correct posture is *defensive patience*: let the ballast do its job, and treat a genuine correlated crash as the eventual signal to deploy Bucket C, not to have pre-spent it.
- **Not a trip:** the calm, dispersed, index-pinned state itself (that's the *setup*, and it's benign while it lasts); normal single-name volatility. Note also: this is a *diagnostic* watch — the hedging trades a vol desk would suggest (buying puts) are derivatives outside your framework; take the regime signal, not the options trade.

---

## Monthly self-check log

*Copy this block each month. Fill the five statuses: OK / WATCH / TRIPPED.*

```
Date: __________

1. AI capex (hyperscaler guidance)     [ OK / WATCH / TRIPPED ]  notes:
2. Gold floor (central-bank buying)    [ OK / WATCH / TRIPPED ]  notes:
3. Inflation regime (PCE + real rate)  [ OK / WATCH / TRIPPED ]  notes:
4. Software moat (organic growth/NRR)  [ OK / WATCH / TRIPPED ]  notes:
5. Speculative (crypto/miner financing)[ OK / WATCH / TRIPPED ]  notes:
6. Market structure (vol/correlation)  [ OK / WATCH / TRIPPED ]  notes:

Action needed? ____________________________________________
(Reminder: #1–5 → re-underwrite/trim the pillar. #6 → protect ballast: don't deploy cash reserve or trim gold into the transition.)
```

---

## Decision rules when a tripwire trips

1. **A trip = re-underwrite that pillar, not an automatic sell.** Ask: has the *thesis* for this pillar changed, or is this price/sentiment noise? Only a genuine thesis break warrants trimming the sleeve.
2. **One trip ≠ abandon the barbell.** The barbell is designed so one leg can fail while the other works. A single tripped pillar is a reason to reduce *that pillar*, not to dismantle the structure.
3. **Distinguish drift from breakage** (this is the whole reason the tripwires are written in business metrics, not prices). A de-rated stock on intact fundamentals is opportunity; a deteriorating *fundamental* is the warning.
4. **Escalate deliberately.** WATCH = check more often (monthly → biweekly). TRIPPED = re-underwrite within the quarter and decide on sleeve sizing.
5. **Remember the real ballast.** In a broad liquidity shock, several pillars can trip at once — the protection then is cash + physical gold, not the barbell. Don't expect the tripwires to save you from a correlated crash; that's what the 30% cash and gold are for.

---

*Not investment advice. This is a discipline tool; the readings and decisions are yours. Claude can analyze your readings on demand but cannot monitor or notify in the background — set your own recurring reminders so the checks actually happen.*
