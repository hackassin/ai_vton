# Virtual Try-On

A mobile-first **PWA** (installable web app) that lets you browse garments from
multiple retail sources and try them on your own photo using an AI virtual
try-on model.

- **Runs on your phone** — no App Store. Open the URL in your phone's browser and
  "Add to Home Screen". It behaves like a native app (fullscreen, offline shell,
  camera access).
- **Pluggable try-on engine** — `mock` (free, on-device preview), `fashn`, or
  `replicate` (photorealistic AI). Swap with one env var; API keys stay on the
  server, never in the browser.
- **Pluggable sources** — a built-in demo catalog today, plus a generic
  "import from URL" scraper. Add real retailer adapters without touching the UI.

## Quick start

```bash
cd virtual-tryon
npm install
cp .env.example .env      # defaults to the free "mock" engine
npm run dev
```

- Web app: http://localhost:5173
- API server: http://localhost:3001

### Run it on your phone (same Wi-Fi)

`npm run dev` starts Vite with `--host`, so it prints a **Network** URL like
`http://192.168.1.23:5173`. Open that on your phone's browser, then use the
browser menu → **Add to Home Screen**. The `/api` calls are proxied to the
backend automatically.

> If your phone can't reach it, allow Node through your firewall or set
> `API_TARGET` and ensure both devices are on the same network.

## Turning on real AI try-on

Edit `.env`:

```env
TRYON_ENGINE=fashn
FASHN_API_KEY=sk-...
# or
TRYON_ENGINE=replicate
REPLICATE_API_TOKEN=r8_...
```

Restart the server. The engine badge in the header reflects the active engine.
Real engines need a **photo-quality garment image** (a flat lay or on-model
shot). The demo catalog uses vector art, which only works with the `mock`
preview — use **Import URL** on a real product page for realistic results.

## Architecture

```
server/
  index.js            Express API (keeps API keys server-side)
  tryon/
    index.js          engine registry  ── run({personImage, garmentImage, category})
    mock.js           on-device overlay preview (no key)
    fashn.js          FASHN.ai adapter
    replicate.js      Replicate IDM-VTON adapter
  sources/
    index.js          source registry  ── list(), get(), importFromUrl()
    mock.js           built-in demo catalog
    scraper.js        generic Open Graph / JSON-LD product importer
    catalog.js        demo product data
src/                  React + Vite PWA (mobile-first)
public/garments/      self-contained vector garment art
```

### Add a real retailer

**Easiest:** paste a product URL into **Import URL** — the scraper reads the
page's Open Graph / schema.org tags (title, image, price) that most shops
publish. Works on many sites with zero code.

**Custom:** add CSS selectors for a host in `server/sources/scraper.js`
(`RETAILER_RULES`), or write a new adapter in `server/sources/` implementing
`list()` / `get()` and register it in `sources/index.js`.

## ⚠️ Scraping & legal

The importer reads only the **public metadata** of a URL you explicitly paste
(like a link preview). Product images and data are typically copyrighted and
governed by each site's Terms of Service and `robots.txt`. This is intended for
personal use. Before pulling data at scale, review the site's ToS and prefer
official product APIs or affiliate feeds where available.

## Deploy

`npm run build` outputs `dist/`. In production the Express server serves it:

```bash
npm run build
npm start           # serves API + built PWA on $PORT
```

Host on any Node platform (Render, Railway, Fly, a VPS). Serve over **HTTPS** —
PWA install and camera access require a secure context.
