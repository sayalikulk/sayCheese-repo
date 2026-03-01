# DayAdapt

A weather-aware outfit recommendation app that learns your wardrobe and suggests daily outfits based on real-time conditions, your activity, and how you want to feel.

---

## What It Does

**Wardrobe Onboarding** — Upload photos of your clothing. Claude Vision auto-tags each item with warmth, breathability, waterproofing, occasion, color, and comfort rating. Items are organized into essentials (tops, pants, shoes) and optionals (thermals, jackets, scarves, hats, gloves, etc.).

**Daily Outfit Recommendation** — A three-layer engine: a Weather API pulls live temperature, feels-like, humidity, rain probability, UV index, and wind. An algorithmic scoring layer pre-filters and ranks items. Claude then reasons over that shortlist and returns two outfit options per category — with a plain-English explanation for each pick.

**Wear Logging & Insights** — Users confirm what they're actually wearing each day (or pick from their wardrobe directly). This prevents repeat recommendations and feeds into weekly and monthly utilization reports, surfacing items that rarely get worn.

**Activity & Mood Context** — Tell the app what you're doing — gym, office, outdoor brunch, rest day — and adjust for how you want to feel (confident, relaxed, energized). Recommendations shift accordingly across formality, breathability, and style tone.

**Health-Aware Nudges** — High UV days surface long-sleeve suggestions with a brief callout. Wind chill and afternoon temperature drops trigger layering warnings. Physical activities prioritize moisture-wicking fabrics from your actual wardrobe.

---

## Custom-Built Logic

- **Outfit Ranking Engine** — Claude reasons over your wardrobe against live weather data, not generic rules
- **Daily Readiness Score** — 5-axis breakdown across Comfort, Activity Match, Weather Risk, Outfit Suitability, and Sustainability
- **Sustainability Scoring** — Per-item eco score inferred from material type via Claude Vision
- **Preference Learning Loop** — User feedback stored and injected into future Claude prompts
- **Outfit Repetition Tracking** — `wornCount` per item in Firestore prevents stale recommendations
- **Weather-Adaptive UI** — Canvas animations and gradient themes driven by live weather codes and temperature

---

## Tech Stack

| Layer | Technology |
|---|---|
| Vision + Reasoning | Claude (Anthropic) |
| Weather Data | Real-time Weather API from open-meteo |
| Pre-filter Engine and filtering | Custom algorithmic scoring layer and LLM filter|
| Database | Firebase / Firestore |
| Backend | Node.js |

---

## Demo Flow

Three moments that sell the idea: scanning a clothing item and watching it get tagged instantly → receiving a recommendation with a clear, reasoned explanation → seeing the weekly outfit planner laid out against the forecast.
