# Streetwise Score

Intelligent StreetEasy property analysis and scoring. Paste a listing URL or enter details manually to get a transparent, factor‑by‑factor score with clear reasoning.

Highlights
- Transparent scoring: Price, Location, Schools, Building, Amenities, Neighborhood, Market Context, Lifestyle.
- Quick entry: Paste a StreetEasy URL or fill in a structured form.
- Clean UI: Responsive, accessible, dark‑mode by default (toggle available).
- Results UX: Uniform card heights; details expand and scroll; amenities list one per line.
- Solo releases: Auto-tagging on main and GitHub Releases with generated notes.

Tech Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Edge Function for scraping helpers)

Getting Started
- Requirements: Node 18+ and npm.
- Install: `npm i`
- Develop: `npm run dev` (Vite dev server on port 8080)
- Lint: `npm run lint`
- Build: `npm run build`
- Preview build: `npm run preview`

Configuration
- App config (Vite env). Create a `.env` with:
  - `VITE_SUPABASE_URL` — your Supabase project URL
  - `VITE_SUPABASE_PROJECT_ID` — project ref/id
  - `VITE_SUPABASE_PUBLISHABLE_KEY` — anon/public key
- Supabase edge function env (set in Supabase dashboard → Project → Functions → Environment variables):
  - `FIRECRAWL_API_KEY` — optional, used to fetch and parse pages
  - `OPENAI_API_KEY` — optional, used to enhance parsing/analysis

Note: The generated Supabase client currently inlines the URL/key in `src/integrations/supabase/client.ts`. Consider switching to `import.meta.env` for local development.

Key Scripts
- `dev`: start Vite
- `build`: production build
- `preview`: preview built app
- `lint`: run eslint

Project Structure
- `src/pages/Index.tsx` — Home, form, and results layout
- `src/components/PropertyForm.tsx` — Manual entry and StreetEasy URL flow
- `src/components/ScoreCard.tsx` — Score breakdown cards + details
- `src/utils/scoringAlgorithm.ts` — Factor calculation and weighting
- `src/components/layout/` — Header/Footer
- `src/styles/` — App layout styles (tasteful.css)
- `supabase/functions/scrape-streeteasy/` — Edge function (uses optional Firecrawl + OpenAI)

Releases (Solo Workflow)
- Auto-tagging: Any push to `main` triggers an auto version bump (patch by default).
- Auto release: Tag pushes create a GitHub Release with generated notes.
- Manual run: In Actions → “Solo Release”, run with input `bump` = `patch` | `minor` | `major` to control the next tag.

Development Notes
- Dark mode: default on first load; user preference persists.
- Cards: Fixed height; expanded details scroll within the card.
- Amenities: Listed vertically; native scrolling enabled in details.

Security
- Do not commit secrets. Only the Supabase anon/publishable key belongs on the client.
- Service role or private keys must never be exposed in the frontend.

Questions / Ideas
Open an issue or file a PR. If you want changes to the scoring model or data inputs, start with `src/utils/scoringAlgorithm.ts` and the `PropertyForm` field set.

## Releases

Automated release workflow is enabled on `main`:

- Push to `main` triggers auto-tagging (patch by default).
- Tag pushes trigger a GitHub Release with generated notes.

You can also manually run the "Solo Release" workflow in Actions and choose the bump level (patch/minor/major).
