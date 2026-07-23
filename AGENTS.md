# AGENTS.md

## Project overview

React + TypeScript SPA — a POS (Point of Sale) system for mobile accessory shops with dual-location inventory (warehouse + storefront). Backend is a separate API; this repo is frontend only.

## Commands

```bash
npm run dev       # Vite dev server on port 3000
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

There is no lint, typecheck, or test script. No formatter config. The project relies on Vite + TypeScript only.

## Architecture

- **Entry**: `index.tsx` → `App.tsx` (BrowserRouter + routes)
- **State**: React Context (`context/AppContext.tsx`) with localStorage persistence (`services/dataService.ts`). Some data comes from localStorage, some from the API backend — not a clean split.
- **API**: Axios configured in `services/axios.ts`. Base URL from `VITE_API_BASE_URL` env var. Auth token stored in localStorage, attached to all requests via interceptor. 401 → redirect to `/login`.
- **i18n**: English + Myanmar via `context/LanguageContext.tsx`. Default language is Myanmar (`my`). Translation keys are dot-separated (e.g. `sales.title`).
- **Styling**: Tailwind CSS loaded via CDN in `index.html` (not PostCSS). Custom theme colors defined inline in `tailwind.config` inside the HTML. Use the `brand`, `primary`, `btn`, `status` color tokens.
- **Deploy**: Netlify (SPA redirect in `netlify.toml`). No CI workflows in this repo.
- **AI Chat**: `pages/AIChat.tsx` + `services/Chatbot/` use the Vercel AI SDK (`ai` + `@ai-sdk/react`). `vite.config.ts` exposes `GEMINI_API_KEY` as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

## Path alias

`@/*` maps to the project root. Use `@/pages/...`, `@/services/...`, etc.

## Key files

| File | Purpose |
|---|---|
| `App.tsx` | Route definitions and layout |
| `types.ts` | Core domain types (Product, Sale, Order, etc.) |
| `constants.ts` | Initial seed data for localStorage |
| `services/axios.ts` | Axios instance + auth interceptors |
| `services/dataService.ts` | localStorage read/write |
| `context/AppContext.tsx` | Global state + actions |
| `context/LanguageContext.tsx` | i18n provider |
| `pages/AIChat.tsx` | AI chat interface (Vercel AI SDK) |
| `.env` | API base URL and env-specific config |

## Conventions

- Services are organized by domain under `services/` (e.g. `Order/`, `Purchase/`, `Inventory/`). Each service file exports a single async function that returns `{ success, message, data }`.
- Pages live in `pages/`, components in `components/`. Subdirectories mirror page names (e.g. `components/Orders/`, `components/POS/`).
- Toast notifications use `sonner` (imported as `toast`).
- Receipts use print CSS (`@media print` in `index.html`). Thermal receipt component: `components/ThermalReceipt.tsx`.
- The app has a dual data model: some entities live in localStorage (offline POS), others come from the API backend (orders, inventory via services). Be careful when adding features — understand which data source applies.

## Gotchas

- Tailwind is CDN-loaded with a custom config in `index.html`. Adding new Tailwind classes works immediately, but custom theme tokens must be added to the inline config, not a separate file.
- No test suite exists. Verify changes by running `npm run build` and checking the dev server manually.
- The `@` path alias is configured in both `tsconfig.json` (for TS) and `vite.config.ts` (for bundler). If you add new aliases, update both.
- `.env` contains multiple commented-out API URLs. The active one is `http://localhost:5000/api/v1/`. Do not commit real API keys.
- Auth token is in `localStorage` under key `authToken`. The `ProtectedRoute` component validates it at most once per tab session (30 min TTL cached in `utils/authSession.ts`).
- `index.html` has an import map mapping `uuid`, `react`, `lucide-react`, `recharts` to CDN URLs from `aistudiocdn.com`. These are vestigial — Vite resolves from `node_modules`. Just `npm install` new packages; don't touch the import map.
- `vite.config.ts` binds dev server to `0.0.0.0` (all interfaces), not just localhost.
- Duplicate `PaymentMethod` enum: `types.ts` (root, canonical for most types) and `types/pos.ts` (POS-specific, adds `MMQR`, `NORMAL`, `HOT`). When modifying payment methods, update the relevant file.
- `index.html` references `/index.css` but the file doesn't exist in the repo (silent 404 in dev, not a build error).
