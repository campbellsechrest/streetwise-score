# 🚕 Streetwise
Intelligent StreetEasy scraping and analysis - find out if an NYC listing is worth the price using a weighted algorithm.

## Demo
Try it now: https://campbellsechrest.github.io/streetwise-score/

## Highlights
- Multi-factor inputs for price, market context and comps, location/neighborhood, building features, and amenities.
- Weighted algorithm consolidates data into an easily digestible Streetwise Score. 
- Data is automatically extracted from a StreetEasy URL, scraped by Firecrawl and parsed by OpenAI.

## Tech Stack
- Frontend/UI: Vite, React, TypeScript, Tailwind CSS
- Backend/Database: Supabase
- Integrations: OpenAI & FireCrawl API

## Getting Started
- Requirements: Node 18+ and npm.
- Install: `npm i`
- Develop: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Preview build: `npm run preview`


## Project Structure
- `src/pages/Index.tsx` — Page layout and structure
- `src/components/PropertyForm.tsx` — Manual entry and StreetEasy URL flow
- `src/components/ScoreCard.tsx` — Score breakdown + details
- `src/utils/scoringAlgorithm.ts` — Factor calculation and weighting
- `src/styles/` — UI styling
- `supabase/functions/scrape-streeteasy/` — Edge function (uses Firecrawl + OpenAI)
