import { useState } from 'react'
import { tryOn } from '../api.js'
import { fileToDataUrl, formatPrice } from '../lib/image.js'

export default function ProductDetail({ product, person, onSavePerson, onClearPerson, onBack, onResult }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      onSavePerson(await fileToDataUrl(file))
    } catch {
      setError('Could not read that image.')
    }
  }

  const runTryOn = async () => {
    if (!person) return
    setBusy(true); setError(null)
    try {
      const result = await tryOn({
        personImage: person,
        garmentImage: product.garmentImage,
        category: product.category,
      })
      onResult(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="detail">
      <button className="back" onClick={onBack}>← Back</button>

      <div className="detail-hero">
        <img src={product.thumbnail} alt={product.title} />
      </div>

      <h1 className="detail-title">{product.title}</h1>
      <div className="detail-meta">
        <span>{product.brand} · {product.retailer}</span>
        {product.price != null && <span className="price">{formatPrice(product.price, product.currency)}</span>}
      </div>

      <section className="photo-section">
        <h2>Your photo</h2>
        {person ? (
          <div className="photo-preview">
            <img src={person} alt="You" />
            <div className="photo-actions">
              <label className="btn ghost">
                Change
                <input type="file" accept="image/*" hidden onChange={onPickPhoto} />
              </label>
              <button className="btn ghost" onClick={onClearPerson}>Remove</button>
            </div>
          </div>
        ) : (
          <label className="photo-drop">
            <input type="file" accept="image/*" capture="user" hidden onChange={onPickPhoto} />
            <span className="photo-drop-icon">📷</span>
            <span>Take or upload a full-body photo</span>
            <span className="muted small">Stays on your device</span>
          </label>
        )}
      </section>

      {error && <p className="error">{error}</p>}

      <button className="btn primary big" disabled={!person || busy} onClick={runTryOn}>
        {busy ? 'Generating…' : 'Try it on'}
      </button>
      {product.productUrl && (
        <a className="view-listing" href={product.productUrl} target="_blank" rel="noreferrer">
          View original listing ↗
        </a>
      )}
    </div>
  )
}
