// Mock source adapter — serves the built-in demo catalog.
import { CATALOG } from './catalog.js'

export const id = 'mock'
export const label = 'Demo catalog'

export async function list({ q } = {}) {
  if (!q) return CATALOG
  const needle = q.toLowerCase()
  return CATALOG.filter((p) =>
    [p.title, p.brand, p.retailer, p.category].join(' ').toLowerCase().includes(needle),
  )
}

export async function get(id) {
  return CATALOG.find((p) => p.id === id) || null
}
