# Counter Ops — Release Notes

Each entry covers what shipped in that version and the specific files and decisions involved.

---

### v1.2.0 — 2026-04-26 — Sessions, admin CRUD, sync debug, member link fix

**1. Sessions architecture**
All data (members, counters, entries) is now scoped to a named session. `lib/storage.js` rewritten: top-level shape is `{ sessions[], activeSessionId }` with `EMPTY_SESSION` constant and `mergeSessions()` + per-session `mergeEntries/Members/Counters()`. `hooks/useStore.jsx` rewritten with `updateActive(state, updater)` helper that scopes every reducer action to the active session. `StoreProvider` computes `activeSession`, `members`, `counters`, `entries` as derived values so no screen needed rewriting. New actions: `CREATE_SESSION`, `SET_ACTIVE_SESSION`, `RENAME_SESSION`, `REMOVE_SESSION`, `SET_SESSION_SWITCHER`. Sessions are admin-only to create.

**2. SessionSwitcher component**
New `components/SessionSwitcher.jsx` — bottom-sheet portal listing all sessions sorted newest-first. Admin users see Create (inline form), Rename (inline), and Delete (two-tap confirm). Non-admins see read-only list. Mounted in `App.jsx`; opened by tapping the session name in `AppShell` header.

**3. Admin via password form**
Removed `?member=admin&key=…` URL trick. `SettingsScreen.jsx` now shows a password input that dispatches `SET_ADMIN_UNLOCKED` on correct key match (checked against `VITE_ADMIN_KEY`). `adminUnlocked` is transient state (not persisted). Admin panel, session create/rename/delete, and member/counter management are all gated behind this flag.

**4. Admin CRUD with reorder**
`AdminScreen.jsx` rewritten: `SortableRow` component with ↑↓ buttons (`REORDER_MEMBERS`, `REORDER_COUNTERS`), inline `EditForm`, two-tap delete confirm. Counters: no archive toggle (removed). Members: new `REMOVE_MEMBER` / `REMOVE_COUNTER` actions in reducer.

**5. Sync debug log**
`hooks/useSync.js` logs bin ID and key preview (`first10…last4 (N chars)`) at sync start. `lib/sync.js` captures `err.status`, `err.responseBody`, `err.payloadBytes` on failure. `SettingsScreen.jsx` renders last-10 sync entries showing HTTP status, payload KB, and raw response body.

**6. JSONBin `.env` key escaping**
`VITE_JSONBIN_KEY` values that are bcrypt hashes contain `$WORD` sequences which `dotenv-expand` (used by Vite) silently expands to empty strings, truncating the key from 60 to 39 chars and causing 401s. Fix: write each `$` as `\$` in `.env`. Updated `.env.example` with a comment explaining this. Verified via `vite.loadEnv()` returning 60 chars.

**7. Member link fix for accented names**
`AdminScreen.jsx` `slugify()` now calls `.normalize('NFD').replace(/[̀-ͯ]/g, '')` before lowercasing, so `García` → `garcia` instead of `garc-a`. New `FIX_MEMBER_ID` reducer action migrates both the member record and all its entries to the corrected ID. Admin UI shows ⚠️ on rows where the current ID doesn't match the expected slug, and a **Fix ID** button inside the edit form.

**8. Rounded-corner rectangle avatars**
`MemberAvatar.jsx` and `ProfileModal.jsx` changed from `rounded-full` to `rounded-2xl` / `rounded-3xl`.

---

### v1.1.3 — 2026-04-26 — Fix navigation

**1. ScreenRouter re-renders on navigation**
`App.jsx` `ScreenRouter` was reading `window.location.search` directly on render. `history.pushState` (called by `useNavigate`) does not trigger a React re-render, so tapping nav buttons updated the URL but the screen never changed. Fixed by reading `activeScreen` from `StoreContext` instead — store dispatch causes the re-render. Added `useStore` to the import in `App.jsx`.

**2. Stray dispatch assignment in AppShell**
`AppShell.jsx` had `const dispatch = useStore()` which assigned the state object (not a dispatch function) to `dispatch`. Removed — `openProfile` already uses a custom event and never needed it.

---

### v1.1.2 — 2026-04-26 — Fix blank screen on GitHub Pages

**1. vite.config.js base path**
`base: '/counter-ops/'` was placed as a stray top-level statement outside `defineConfig()` — a syntax no-op that left all asset URLs as `/assets/…`, causing a blank screen on the subpath deploy. Moved inside `defineConfig({ base: '/counter-ops/', … })` where Vite reads it.

**2. PWA manifest start_url**
Updated `start_url` from `'/'` to `'/counter-ops/'` in the VitePWA manifest block so the installed PWA opens to the correct path.

---

### v1.1.1 — 2026-04-26 — GitHub Pages subpath fix

**1. Base path**
Added `base: '/counter-ops/'` to `app/vite.config.js` (top-level, before `defineConfig`). Ensures all JS/CSS asset URLs and the PWA `start_url` resolve correctly when the app is served from `https://oscarini-garcia.github.io/counter-ops/` rather than a root domain.

---

### v1.1.0 — 2026-04-26 — GitHub Pages deploy workflow

**1. CI/CD**
Added `.github/workflows/deploy.yml`. On every push to `main`: checks out the repo, installs Node 20, runs `npm install && npm run build` inside `app/` with the three secrets (`VITE_JSONBIN_ID`, `VITE_JSONBIN_KEY`, `VITE_ADMIN_KEY`) injected as env vars, uploads `app/dist` as a Pages artifact, and deploys via `actions/deploy-pages@v4`. The deployment URL is surfaced as the environment URL in the GitHub Actions UI.

---

### v1.0.1 — 2026-04-26 — Lock file

**1. Reproducible installs**
Added `app/package-lock.json` — generated by `npm install` during initial scaffold. Ensures consistent dependency resolution across machines and CI.

---

### v1.0.0 — 2026-04-26 — Full app

**1. Data layer**
`lib/storage.js` — `loadStore()`, `saveStore()`, `mergeEntries()`, `mergeMembers()`, `mergeCounters()`. `lib/ids.js` — `generateEntryId()` producing `{member}_{ts}_{rand4}`. `hooks/useStore.jsx` — single `useReducer` with 15 action types; persists to localStorage on every dispatch. `hooks/useMember.js` — resolves `?member=` URL param.

**2. Sync**
`lib/sync.js` — JSONBin `GET`/`PUT` helpers and full push-pull-merge cycle. `hooks/useSync.js` — pulls on mount, fires background push on every `counter-ops:sync` custom event, retries on reconnect. `SyncBootstrap.jsx` mounts the hook as a side-effect component. `SyncBadge.jsx` doubles as a manual sync tap target (✅/🔄/⚠️).

**3. Core screens**
`HomeScreen` — scoreboard with crown/donkey/streak overlays, quick-add tap per counter. `LogEntryScreen` — GPS fires on open with 5s timeout → last-5-locations fallback chips; who/what/qty/note form; 10s undo toast (`UndoToast.jsx`). `EntryLogScreen` — reverse-chronological list with member + counter filter selects. `AppShell` — header + offline banner + bottom nav.

**4. Report screen**
`ReportScreen` — leaderboard (toggleable per counter), timeline bar chart (`TimelineChart.jsx`, Recharts, lazy), map with emoji pins (`LeafletMap.jsx`, Leaflet + OSM, lazy), trip summary card, moments feed, end-of-trip awards. `lib/awards.js` generates five award categories from entry data.

**5. Gamification**
`lib/gamification.js` — `getChampion()` (daily), `getDonkey()` (overall least), `getStreaks()` (consecutive days per member/counter), `getRandomTaunt()`, `checkMilestones()` (thresholds: 10/25/50/100/200). `ConfettiOverlay.jsx` — `canvas-confetti` lazy-loaded, ≤80 particles. `TauntToast.jsx` — 2.5s overlay on entry.

**6. Profile + Admin + Settings**
`ProfileModal.jsx` — name edit + camera/gallery avatar via `browser-image-compression` (≤200×200, <30KB, base64). `AdminScreen.jsx` — counter CRUD with emoji auto-suggest, member list, per-member QR codes (`QRCodeCard.jsx`, `qrcode.react`), key-protected via `?member=admin&key=`. `SettingsScreen.jsx` — session name, force SW refresh, sync log (last 10), reset with confirmation.

**7. GPS + geolocation**
`lib/geo.js` — Nominatim reverse-geocode, `getRecentLocations()`. `hooks/useGPS.js` — 5s timeout, denied/timeout → fallback list.

**8. Docs**
`INSTALL.md` — end-to-end setup guide covering JSONBin config, GitHub Pages/Vercel/Netlify deploy, iOS PWA install, first-time admin flow, troubleshooting.

---

### v0.1.0 — 2026-04-26 — Initial scaffold

**1. Project structure**
Initialised `app/` with Vite 6 + React 18 + Tailwind CSS 3. `vite-plugin-pwa` wired with `autoUpdate` service worker, `clientsClaim`, and `skipWaiting` — required for reliable PWA updates on iOS Safari. Offline tile caching for OpenStreetMap via Workbox `CacheFirst`; JSONBin calls excluded from SW cache (`NetworkOnly`).

**2. App shell and routing**
`App.jsx` implements URL-param routing (`?screen=`, `?member=`) via `URLSearchParams` — no router library. All screens are `React.lazy`-loaded. `StoreProvider` wraps the tree; `SyncBootstrap` mounts as a side-effect component to trigger pull-on-load.

**3. Static deployment**
`dist/` output is pure HTML/CSS/JS — deployable to GitHub Pages, Vercel, or Netlify with no server process. HTTPS required for Geolocation API on iOS Safari.

---
