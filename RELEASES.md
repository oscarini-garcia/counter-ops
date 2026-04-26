# Counter Ops — Release Notes

Each entry covers what shipped in that version and the specific files and decisions involved.

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
