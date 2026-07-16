const json = async (res) => {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const getHealth = () => fetch('/api/health').then(json)

export const getProducts = ({ source, q } = {}) => {
  const params = new URLSearchParams()
  if (source && source !== 'all') params.set('source', source)
  if (q) params.set('q', q)
  const qs = params.toString()
  return fetch(`/api/products${qs ? `?${qs}` : ''}`).then(json).then((d) => d.products)
}

export const importFromUrl = (url) =>
  fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }).then(json).then((d) => d.product)

export const tryOn = ({ personImage, garmentImage, category }) =>
  fetch('/api/tryon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personImage, garmentImage, category }),
  }).then(json)
