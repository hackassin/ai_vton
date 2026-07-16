// Source registry. Every adapter implements: list({q}), get(id).
// The scraper additionally implements importFromUrl(url).
import * as mock from './mock.js'
import * as scraper from './scraper.js'

const SOURCES = { mock, scraper }

export function listSources() {
  return Object.values(SOURCES).map((s) => ({ id: s.id, label: s.label }))
}

export async function listProducts({ source, q } = {}) {
  const adapters = source && SOURCES[source] ? [SOURCES[source]] : Object.values(SOURCES)
  const results = await Promise.all(adapters.map((a) => a.list({ q })))
  return results.flat()
}

export async function getProduct(id) {
  const source = String(id).split(':', 1)[0]
  const adapter = SOURCES[source]
  if (!adapter) return null
  return adapter.get(id)
}

export async function importFromUrl(url) {
  return scraper.importFromUrl(url)
}
