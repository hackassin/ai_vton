import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { listProducts, getProduct, importFromUrl } from './sources/index.js'
import { runTryOn, activeEngine } from './tryon/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
// Prefer API_PORT so dev never collides with the web dev server (whose harness
// may inject PORT). In production single-server mode, fall back to a
// platform-provided PORT.
const PORT = process.env.API_PORT || process.env.PORT || 3001

app.use(cors())
// Base64 data URLs for photos can be large; bump the JSON limit.
app.use(express.json({ limit: '25mb' }))

const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((err) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal error' })
})

// ── API ──────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, engine: activeEngine() }))

// Catalog: ?source=mock  and  ?q=search
app.get('/api/products', wrap(async (req, res) => {
  const products = await listProducts({ source: req.query.source, q: req.query.q })
  res.json({ products })
}))

app.get('/api/products/:id', wrap(async (req, res) => {
  const product = await getProduct(req.params.id)
  if (!product) return res.status(404).json({ error: 'Not found' })
  res.json({ product })
}))

// Import a product from any retailer URL (generic Open Graph scraper).
app.post('/api/import', wrap(async (req, res) => {
  const { url } = req.body || {}
  if (!url) return res.status(400).json({ error: 'url is required' })
  const product = await importFromUrl(url)
  res.json({ product })
}))

// Generate a try-on. Body: { personImage: dataURL|url, garmentImage: url, category }
app.post('/api/tryon', wrap(async (req, res) => {
  const { personImage, garmentImage, category } = req.body || {}
  if (!personImage) return res.status(400).json({ error: 'personImage is required' })
  if (!garmentImage) return res.status(400).json({ error: 'garmentImage is required' })
  const result = await runTryOn({ personImage, garmentImage, category })
  res.json(result)
}))

// ── Static (production) ────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'dist')
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}  (try-on engine: ${activeEngine()})`)
})
