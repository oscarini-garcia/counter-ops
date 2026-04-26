# Counter Ops

A mobile-first PWA for tracking family consumption of countable items on holidays — ice creams, drinks, granitas, anything worth counting. Tap to log, sync in the background, laugh at the leaderboard.

---

## How it works

### Identity — no login

Every family member gets a personal URL: `?member=oscar`. That URL *is* the identity. No accounts, no passwords. The admin generates these links and shares them via WhatsApp or QR code.

### Storage — local first

All data lives in the browser's `localStorage`. When you log an entry, it is saved instantly to your device. The app works fully offline from that point.

### Sync — lazy, background

After every entry, the app fires a background push to [JSONBin.io](https://jsonbin.io) — a single JSON document shared by the whole family. When the app loads, it pulls the remote document and merges it with local data. Merge is additive: entries are never deleted or overwritten. If two people tap at the same moment, both entries survive because the next pull recovers anything that got clobbered.

The **⚠️ Sync** button in the header forces an immediate push + pull if you want instant updates.

### Screens

| Screen | What it does |
|---|---|
| **Home** | Scoreboard with per-member totals. Tap any counter to log +1 instantly. |
| **Log** | Full entry form — who, what, how many, location (GPS), optional note. |
| **Entries** | Chronological log of all entries, filterable by member or counter. |
| **Report** | Leaderboard, timeline chart, map, trip summary card, awards. |
| **Admin** | Create counters, add members, generate links + QR codes. `?member=admin&key=…` |
| **Settings** | Session name, force app refresh, sync log, reset local data. |

### Location

GPS fires automatically when you open the Log screen. If it times out (5 seconds) or is denied, the last 5 locations you used appear as tappable chips. No map picker, no free-text input.

### Fun layer

- 👑 **Daily champion** — most consumed today gets a crown on their avatar
- 🐴 **The Donkey** — least consumed overall earns a donkey
- 🔥 **Streaks** — consecutive days on the same counter
- 💬 **Taunts** — a random message appears when you log an entry
- 🎉 **Milestones** — family hits 10, 25, 50… → confetti for everyone
- 🏅 **End-of-trip awards** — auto-generated in the Report screen

---

## Version History

| Version | Date | Summary |
|---|---|---|
| 1.1.1 | 2026-04-26 | Fix asset paths for GitHub Pages subpath deployment |
| 1.1.0 | 2026-04-26 | GitHub Actions workflow for automatic deploy to GitHub Pages |
| 1.0.1 | 2026-04-26 | Add package-lock.json for reproducible installs |
| 1.0.0 | 2026-04-26 | Full app — all screens, GPS sync, gamification, JSONBin remote sync, PWA |
| 0.1.0 | 2026-04-26 | Initial scaffold — Vite + React + Tailwind + PWA manifest |
