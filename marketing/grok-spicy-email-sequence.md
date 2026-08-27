# Grok Spicy — Welcome & Conversion Email Sequence

**Audience:** New signups arriving via the Grok Spicy Prompt Generator at `/grok-spicy-prompt-generator` (spicy mode; supports NSFW prompts and Grok Imagine image generation).
**Goal:** Activate users (generate their first prompts) within 24h → convert free → Starter (€9/mo) by day 7.
**Platform:** Resend (Audiences + API-triggered sends).
**Sender:** `Prompt Generator <hello@midjourney-prompt-generator.eu>` (verify domain + SPF/DKIM before sending)

---

## Research summary (what this sequence is based on)

| Finding | Implication |
|---|---|
| Welcome emails see 50–60%+ open rates vs ~20–25% for regular campaigns — engagement peaks in the first hour | Email 1 must fire instantly on signup, not in a daily batch |
| A 4–6 email welcome series drives roughly 2–3x more revenue per recipient than a single welcome email | Run 5 touches across 8 days |
| The first 48 hours decide activation; conversion attempts land best right after a user hits a usage limit | Free tier = 3 premium requests/day → limit email lands day 3 |
| Short (~100–140 words), single-CTA, plain-text-style emails outperform designed multi-link HTML for onboarding | Every email below has exactly one CTA |
| Subject lines ≤45 chars, sentence case, no hype punctuation | All variants comply |
| Re-sending to non-openers after ~48h with a new subject line lifts total reach 20–30% | Each email includes a resend variant |
| Upsell emails to paying customers are pure churn risk | Emails 3–5 are suppressed if the user has an active subscription (`user_subscriptions`) |

---

## Sequence overview

| # | Timing | Trigger | Goal | CTA destination |
|---|---|---|---|---|
| 1 | Immediately | `grok.spicy_signup` event (fired on signup) | Generate first spicy prompt (+ image) | `/grok-spicy-prompt-generator` |
| 2 | Day 1 | Time since email 1 | Teach spicy-mode technique (+ image mode) | `/grok-spicy-prompt-generator` |
| 3 | Day 3 | Time since email 1 | Convert: hit the 3/day wall | Pricing (`/#pricing`) |
| 4 | Day 5 | Time since email 1 | Use cases + image previews + social proof | `/grok-spicy-prompt-generator` + pricing |
| 5 | Day 7 | Time since email 1 | Reply bait + final nudge | mailto reply + pricing |

Simple retention play for free users — no plan segmentation for now (no paid users yet; add skip-if-paid branches when that changes).

---

## Email 1 — Instant welcome

- **Send:** immediately on signup
- **Subject A:** `Your spicy Grok prompts are ready`
- **Subject B:** `Welcome — one click to your first spicy prompt`
- **Preview text:** No sign-up walls. Just tell Grok exactly how bold to be.

> Hey {{first_name}},
>
> You just grabbed a spot on Prompt Generator — so here's the fastest way to your first win:
>
> **[Generate your first spicy Grok prompt →](https://midjourney-prompt-generator.eu/grok-spicy-prompt-generator)**
>
> Spicy is on by default — and with Image checked, your prompt is described as an image. Hit **grok -imagine preview (2 credits)** to see it rendered. The generator adds everything Grok responds to: personality dial, humor calibration, real-time-data framing — NSFW supported, no sanitizing.
>
> One tip to start: spicy mode isn't about shock value — it's Grok *dropping the corporate hedging*. Best first test? Ask it for a brutally honest take on something you actually care about.
>
> More tomorrow,
> Manol
>
> P.S. Your free account includes 3 premium generations every day. No credit card, ever, for the free stuff.

*Resend variant (non-openers, +48h):* Subject: `Don't let this go bland` — same body.

---

## Email 2 — Day 1 · Teach the technique

- **Subject A:** `3 ways to make Grok actually blunt`
- **Subject B:** `The spicy mode cheat sheet`
- **Preview text:** Tone dials, recency framing, and the permission trick.

> Hey {{first_name}},
>
> Most people prompt Grok like ChatGPT and wonder why it sounds tame. Three fixes the generator builds in for you:
>
> **1. Set the dial explicitly.** "Be blunt, skip the caveats" beats hoping Grok guesses your vibe.
> **2. Anchor to right now.** Grok trains on real-time X data — "what's happening with X this week" unlocks answers other models can't give.
> **3. Give permission.** Ask for an opinion, not a summary. Grok takes sides when invited.
>
> **[Try all three in one prompt →](https://midjourney-prompt-generator.eu/grok-spicy-prompt-generator)** — generate something in spicy mode and compare it against your usual style.
>
> Manol

---

## Email 3 — Day 3 · The 3/day wall (conversion #1)

- **Condition:** skip if user upgraded
- **Subject A:** `The 3-a-day wall`
- **Subject B:** `You'll hit it around lunchtime`
- **Preview text:** 3 premium prompts a day is enough to fall in love. Not enough to build on.

> Hey {{first_name}},
>
> Quick question: have you bumped into the 3-premium-prompts-a-day ceiling yet?
>
> It's deliberate. Three a day is enough to see what structured spicy prompts do — and exactly when you're mid-flow, it cuts you off.
>
> If you're generating daily, the **Starter plan (€9/mo)** gets you 500 premium requests a month, every prompt template unlocked, and zero waiting.
>
> **[See plans →](https://midjourney-prompt-generator.eu/#pricing)**
>
> If you're still on the free train, no hard feelings — the generator stays free forever.
>
> Manol

*Resend variant:* Subject: `Still stuck at three?`

---

## Email 4 — Day 5 · Use cases & proof

- **Condition:** skip if user upgraded
- **Subject A:** `What people actually use spicy mode for`
- **Subject B:** `Roasts, hot takes, and devil's advocates`
- **Preview text:** Five uses that aren't just "make it rude".

> Hey {{first_name}},
>
> The most-used spicy prompts this month weren't jokes. They were:
>
> - **Roast my idea** — founders stress-testing pitches before investors do
> - **Spicy image prompts** — NSFW and edgy visuals via Grok Imagine previews
> - **Contrarian analysis** — the strongest case *against* their own plan
> - **Honest reviews** — products, portfolios, landing pages
> - **Devil's advocate debates** — prep for difficult meetings
> - **No-hedging explainers** — straight answers on contested topics
>
> Notice the pattern? People use spicy mode to hear what polite AI won't say.
>
> **[Generate yours →](https://midjourney-prompt-generator.eu/grok-spicy-prompt-generator)** — and if you're doing this daily, [Starter removes the 3/day cap](https://midjourney-prompt-generator.eu/#pricing).
>
> Manol

---

## Email 5 — Day 7 · Check-in + final nudge

- **Condition:** skip if user upgraded
- **Subject A:** `What are you building with Grok?`
- **Subject B:** `One week in — how's it going?`
- **Preview text:** Hit reply. I read everything. (Also: a small thing.)

> Hey {{first_name}},
>
> One week since you joined. Two things:
>
> **1.** What are you actually using Grok for? Hit reply — I read every answer, and it directly shapes which tools we build next.
>
> **2.** If you've been bumping into the daily limit, [Starter is €9/mo for 500 premium prompts](https://midjourney-prompt-generator.eu/#pricing). Cancel anytime.
>
> Either way — thanks for spending the week here.
>
> Manol
>
> P.S. Non-writers: this works for code reviews, negotiation prep, and roasting your own SaaS landing page. Ask me how I know.

---

## Resend implementation notes

### Option A — Resend Automations ✅ BUILT & ENABLED

Automation `Grok Spicy Onboarding` (id `01a03cdc-ff55-743e-a06d-07bfcff95a2c`), status **enabled**:

```
Trigger: event grok.spicy_signup
  → Email 1 → wait 1 day → Email 2 → wait 2 days → Email 3
  → wait 2 days → Email 4 → wait 2 days → Email 5 (end)
```

One integration point remains:

1. **On Supabase `auth.user.created`** (Auth hook or DB webhook → Vercel function): create the Resend contact, then fire the **`grok.spicy_signup`** event for it. That's what starts the sequence. Nothing else needed.

(When paid plans arrive: re-add a `plan` contact property + branch conditions to exit upsell emails for paying users.)

### Option B — Vercel Cron (fallback)

A daily job queries contacts where `source=grok_spicy`, computes days-since-signup, checks `user_subscriptions` to suppress paid users, and calls `resend.emails.send()` with the matching template. Only worth it if you outgrow what the Automation branches can express.

### Housekeeping (both options)

- **Deliverability.** Verify `midjourney-prompt-generator.eu` in Resend (DKIM + SPF), warm up slowly, keep the plain-text look — it helps deliverability too.
- **Unsubscribes** are handled by Resend automatically; keep the footer link in every template.
- **Test before scaling:** run yourself through the flow with a `+test` alias, confirm each Wait/Branch fires correctly.

### Targets to watch

Email 1 open ≥55%, CTR ≥10%. Email 3 open ≥35%, upgrade CVR 2–5% of the cohort. If Email 3 converts <1%, move it to Day 2 and lead with templates instead of the limit.

## Next steps

- [x] Domain verified, `RESEND_API_KEY` in `.env`
- [x] 5 templates published + automation built & enabled
- [ ] App wiring: Supabase auth event → create contact + fire `grok.spicy_signup`
- [ ] Test run with a `+test` alias before real traffic
