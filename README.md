# 🚕 Streetwise Scoring Algorithm
Intelligent data scraping and analysis to determine if an NYC apartment listing is worth its asking price.

### Tech Stack
- **Frontend/UI:** Vite, React, TypeScript, Tailwind CSS
- **Backend/Database:** Supabase
- **Integrations:** OpenAI & FireCrawl

---

## How It Works
Streetwise converts the raw [Streeteasy](https://streeteasy.com/) listing + neighborhood signals into a single 0–100 score.

At a high level:

```
Score = clamp( round( Σ (weight\_i × subscore\_i) + bonuses − penalties ), 0, 100 )
```
- Weights are percentages that sum to 100 (penalties are applied after the weighted sum).
- Bonuses/Penalties are bounded adjustments for edge cases (i.e. assessments, no board approval).

### 1) Data Extraction
- **Firecrawl** scrapes the Streeteasy listing and building pages for available raw data (address, price, beds/baths, square footage, monthly fees, days on market, building year, amenities, floor, etc.).
- **OpenAI** parses the page into a reliable JSON (schema in `src/types/Listing.ts`) and infers additional info where possible from the written description (i.e. light exposure, unit condition).

> Square footage carries significant weight but is often absent from listings. The model has a fallback to use sqft estimates based on room count/typical ratios, with a confidence flag that slightly dampens related subscores.

### 2) Normalization
Each factor is mapped to 0–100 using min–max ranges, caps, and outlier handling:
- **Min–Max with Caps**: robust ranges (2nd–98th percentile) to avoid outlier distortion.
- **Winsorization**: extreme values are clipped to protect the score from noisy data.
- **Directionality**: for "lower-is-better" metrics (e.g., price per sqft, days on market), the scale is inverted.

### 3) Subscores & Default Weights

| Bucket | What it measures | Weight |
|---|---|---|
| **Price vs. Fair Value** | Listing price vs expected value (comps, $/sqft, adjustments) | **35%** |
| **Market Context** | Days on market, recent price cuts, neighborhood liquidity & trend | **15%** |
| **Location & Access** | Block quality, subway distance, noise, school zoning, parks | **15%** |
| **Building Quality** | Year/era, condition, elevator/doorman, amenities, maintenance/ft² | **20%** |
| **Unit & Layout** | Light/exposure, floor height, renovated vs estate, layout efficiency | **10%** |
| **Bonuses / Penalties** | Assessments, litigation, co-op restrictions, sponsor sale, etc. | **±5–15** |

> You can edit weights in `src/utils/scoringAlgorithm.ts` (see `WEIGHTS` object).

#### Price vs. Fair Value (35%)
- Compute **Expected Price** from past **comps** (same neighborhood/line/era), adjusted for:
  - **$/ft² baseline** ± deltas for floor height, outdoor space, renovation, view, building quality.
  - **Market Drift** (recent neighborhood median trend).
- Subscore formula (mapped to 0–100):

```

price\_gap = (expected\_price - asking\_price) / expected\_price
price\_subscore = scale\_to\_0\_100( price\_gap, target=0%, good=+8% under ask, bad=+8% over ask )

````

#### Market Context (15%)
- Inputs: **days on market**, **discount history**, **inventory pressure**, **absorption**, **seasonality**.
- Signals upweight if the unit has healthy demand signals or a meaningful discount from original ask.

#### Location & Access (15%)
- Distance to **nearest subway**, **noise proxy** (proximity to avenues, highways, nightlife), **park access**, and **school zoning** where applicable.
- Block/lot heuristics (corner, mid-block), and **street aesthetic** where inferable from text.

#### Building Quality (20%)
- **Era** (prewar/postwar/new dev), **condition**, **elevator/doorman**, **amenities**, **maintenance per ft²** (penalized if high vs neighborhood median).
- Co-op vs condo nuances (e.g., down-payment norms don’t affect score; **sublet policy** does under “Penalties”).

#### Unit & Layout (10%)
- **Exposure/light**, **usable layout** (hallway waste, split beds), **renovation state**, **private outdoor space**, **ceiling height** if available.

#### Bonuses & Penalties (±5–15)
- **Bonuses:** private outdoor space, truly low carrying costs, recent high-quality gut renovation with proof.
- **Penalties:** ongoing **assessments**, pending **litigation**, **no-sublet** policy, **estate condition** lacking essential systems, severe **noise**/bar exposure, unusual **transfer fees**.

### 4) Pseudocode (TypeScript-ish)

```ts
type Subscores = {
price: number;        // 0..100
market: number;       // 0..100
location: number;     // 0..100
building: number;     // 0..100
unit: number;         // 0..100
};

const WEIGHTS = {
price: 0.35,
market: 0.15,
location: 0.15,
building: 0.20,
unit: 0.10,
} as const;

export function scoreListing(s: Subscores, adj: { bonus?: number; penalty?: number } = {}) {
const base =
  WEIGHTS.price * s.price +
  WEIGHTS.market * s.market +
  WEIGHTS.location * s.location +
  WEIGHTS.building * s.building +
  WEIGHTS.unit * s.unit;

const total = Math.round(base + (adj.bonus ?? 0) - (adj.penalty ?? 0));
return Math.max(0, Math.min(100, total));
}
````

### 5) Example Scorecard (Rendered in UI)

| Bucket                |            Subscore |
| --------------------- | ------------------: |
| Price vs Fair Value   |                  82 |
| Market Context        |                  61 |
| Location & Access     |                  74 |
| Building Quality      |                  68 |
| Unit & Layout         |                  77 |
| **Bonuses/Penalties** | **−5 (assessment)** |
| **Streetwise Score**  |        **76 / 100** |

### 6) Data Quality & Safeguards

* **Missing data**: if sqft or comps are missing, the price bucket confidence is reduced and its impact is slightly shrunk.
* **Outlier guardrails**: values are clipped to reasonable bounds per neighborhood.
* **Explainability**: the app displays the per-bucket breakdown so you can see *why* a listing scored the way it did.

> ⚖️ *Disclaimer:* This is an informational heuristic, not financial or legal advice. Always verify facts (offering plan, board minutes, assessments, liens) with your agent/attorney.
>
> ## Getting Started
- Requirements: Node 18+ and npm.
- Install: `npm i`
- Develop: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Preview build: `npm run preview`

---

```

want me to wire this into your actual `README.md` and add a little “Weights” JSON block so others can tweak it easily?
```
