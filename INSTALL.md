# Installation & Deployment Guide

Everything you need to go from zero to a live family app.

---

## 1. Prerequisites

- Node.js 18+ and npm
- A free [JSONBin.io](https://jsonbin.io) account
- A free [GitHub](https://github.com), [Vercel](https://vercel.com), or [Netlify](https://netlify.com) account for hosting

---

## 2. Set up JSONBin.io

JSONBin is the shared remote store — it holds a single JSON document that all family devices sync to.

1. Sign up at [jsonbin.io](https://jsonbin.io) (free tier is sufficient)
2. Go to **API Keys** in the dashboard and copy your **Master Key**
3. Click **+ Create Bin**
4. Paste in this starter JSON and save:

```json
{
  "session": "my-trip",
  "members": [],
  "counters": [],
  "entries": [],
  "milestonesFired": []
}
```

5. Copy the **Bin ID** from the URL (e.g. `64f3a1b2e3d...`)

---

## 3. Configure environment variables

```bash
cd app
cp .env.example .env
```

Edit `.env`:

```
VITE_JSONBIN_ID=your_bin_id_here
VITE_JSONBIN_KEY=$2a$10$your_master_key_here
VITE_ADMIN_KEY=pick_a_secret_word
```

`VITE_ADMIN_KEY` is the password for the admin panel. Choose anything — you'll add it to the URL as `?member=admin&key=your_secret_word`.

> **Security note:** These values are baked into the compiled JS bundle. Anyone who opens DevTools on your deployed app can read them. This is acceptable for a private family app — the risk is low. Change `VITE_ADMIN_KEY` each trip.

---

## 4. Run locally

```bash
cd app
npm install
npm run dev
```

The app opens at `http://localhost:5173`. For GPS to work on an iPhone, you need HTTPS. Expose the dev server over your local network:

```bash
npm run dev -- --host
```

Then open `https://YOUR_LOCAL_IP:5173` on your iPhone. Safari will warn about the self-signed cert — tap **Advanced → Proceed anyway**.

---

## 5. Build

```bash
cd app
npm run build
```

This produces a `dist/` folder of pure static files — HTML, CSS, JS, a service worker, and a PWA manifest. No server needed.

---

## 6. Deploy

### Option A — GitHub Pages (recommended for simplicity)

1. Push the repo to GitHub
2. Go to **Settings → Pages** and set the source to **GitHub Actions**
3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install and build
        working-directory: app
        env:
          VITE_JSONBIN_ID: ${{ secrets.VITE_JSONBIN_ID }}
          VITE_JSONBIN_KEY: ${{ secrets.VITE_JSONBIN_KEY }}
          VITE_ADMIN_KEY: ${{ secrets.VITE_ADMIN_KEY }}
        run: |
          npm install
          npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: app/dist
      - uses: actions/deploy-pages@v4
        id: deployment
```

4. Add your three env vars as **repository secrets** (Settings → Secrets → Actions)
5. If deploying to `https://username.github.io/counter-ops/` (a subpath), add `base: '/counter-ops/'` to `app/vite.config.js` before the build

### Option B — Vercel

1. Install the Vercel CLI: `npm i -g vercel`
2. From the `app/` directory: `vercel --prod`
3. Set the three env vars in the Vercel project settings (or pass via `vercel env add`)
4. Redeploy after setting vars

### Option C — Netlify

1. Connect the repo in the Netlify dashboard
2. Set build command: `cd app && npm install && npm run build`
3. Set publish directory: `app/dist`
4. Add the three env vars under **Site settings → Environment variables**

---

## 7. Share with family

After deploying, distribute links:

| Person | URL |
|---|---|
| Oscar | `https://your-app.com?member=oscar` |
| Ana | `https://your-app.com?member=ana` |
| Admin | `https://your-app.com?member=admin&key=YOUR_ADMIN_KEY` |

Or open the Admin panel (`?member=admin&key=…`) and share the QR codes it generates — one per family member.

---

## 8. First-time setup (Admin)

1. Open the admin URL
2. Add family members (name → auto-generates ID)
3. Add counters (name → emoji auto-suggested, you can override)
4. Share member QR codes to the family WhatsApp group
5. Each member opens their link, taps the avatar in the header, and sets their display name and photo

---

## 9. Install as PWA on iOS

1. Open the app URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button → **Add to Home Screen**
3. Tap **Add**

The app will appear on the home screen and open full-screen like a native app. GPS, camera, and background sync (on-open + manual button) all work from the home screen icon.

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Sync button shows ⚠️ | Check `.env` values, confirm Bin ID and Key are correct |
| GPS never resolves | Ensure the app is served over HTTPS |
| App shows old version after deploy | Tap Settings → Force refresh |
| Admin panel shows Home instead | Check `?key=` matches `VITE_ADMIN_KEY` exactly |
| JSONBin free tier limit | Free tier allows 10k requests/month — more than enough for a holiday |
