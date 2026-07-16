import { useEffect, useMemo, useState } from 'react'
import { getProducts, importFromUrl } from '../api.js'
import ProductCard from './ProductCard.jsx'

export default function Catalog({ onSelect }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('all')
  const [imported, setImported] = useState([])
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    getProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter((c) => c && c !== 'auto'))
    return ['all', ...set]
  }, [products])

  const all = [...imported, ...products]
  const filtered = all.filter((p) => {
    const okCat = category === 'all' || p.category === category
    const okQ = !q || [p.title, p.brand, p.retailer].join(' ').toLowerCase().includes(q.toLowerCase())
    return okCat && okQ
  })

  return (
    <div className="catalog">
      <div className="catalog-head">
        <input
          className="search"
          type="search"
          placeholder="Search garments…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn ghost" onClick={() => setImportOpen(true)}>+ Import URL</button>
      </div>

      <div className="chips">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {importOpen && (
        <ImportRow
          onClose={() => setImportOpen(false)}
          onImported={(p) => { setImported((prev) => [p, ...prev]); setImportOpen(false) }}
        />
      )}

      {loading && <p className="muted">Loading catalog…</p>}
      {error && <p className="error">Couldn’t load products: {error}</p>}

      <div className="grid">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onClick={() => onSelect(p)} />
        ))}
      </div>
      {!loading && !filtered.length && <p className="muted">No garments match.</p>}
    </div>
  )
}

function ImportRow({ onClose, onImported }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const submit = async () => {
    if (!url) return
    setBusy(true); setErr(null)
    try {
      onImported(await importFromUrl(url))
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="import-row">
      <input
        className="search"
        type="url"
        placeholder="Paste a product page URL…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        autoFocus
      />
      <button className="btn" onClick={submit} disabled={busy}>{busy ? '…' : 'Import'}</button>
      <button className="btn ghost" onClick={onClose}>Cancel</button>
      {err && <p className="error">{err}</p>}
    </div>
  )
}
