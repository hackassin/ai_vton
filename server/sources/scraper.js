// Generic retailer scraper adapter.
//
// Given a product-page URL from (most) retail sites, it extracts title, image,
// price and brand from Open Graph / schema.org metadata — the tags retailers
// publish precisely so their products render nicely when shared. This works
// across many sites without site-specific code.
//
// For sites that need bespoke handling, add an entry to RETAILER_RULES with CSS
// selectors; `parse()` prefers a matching rule, then falls back to OG/JSON-LD.
//
// ⚠️  Legal note: scraping is governed by each site's Terms of Service and
// robots.txt, and product images are usually copyrighted. This reads only the
// public metadata of a URL a user explicitly pastes (like a link preview) and
// is meant for personal use. Review a site's ToS before automating bulk pulls,
// and prefer official product APIs / affiliate feeds where available.
import * as cheerio from 'cheerio'

export const id = 'scraper'
export const label = 'Imported from URL'

// Per-retailer overrides. hostname (without www.) -> selectors.
const RETAILER_RULES = {
  // 'www.example-shop.com': {
  //   title: 'h1.product-title',
  //   price: 'span.price',
  //   image: 'img.gallery__main::attr(src)',
  // },
}

function hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function pickMeta($, names) {
  for (const n of names) {
    const v =
      $(`meta[property="${n}"]`).attr('content') ||
      $(`meta[name="${n}"]`).attr('content')
    if (v) return v.trim()
  }
  return undefined
}

function fromJsonLd($) {
  let out = {}
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).contents().text())
      const nodes = Array.isArray(json) ? json : json['@graph'] || [json]
      for (const node of nodes) {
        const type = String(node['@type'] || '').toLowerCase()
        if (type.includes('product')) {
          const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers
          out = {
            title: node.name,
            brand: typeof node.brand === 'object' ? node.brand?.name : node.brand,
            image: Array.isArray(node.image) ? node.image[0] : node.image,
            price: offer?.price ? Number(offer.price) : undefined,
            currency: offer?.priceCurrency,
          }
        }
      }
    } catch { /* ignore malformed blocks */ }
  })
  return out
}

export async function importFromUrl(url) {
  const res = await fetch(url, {
    headers: {
      // Identify politely; some CDNs block empty UAs.
      'User-Agent': 'Mozilla/5.0 (compatible; VirtualTryOnBot/0.1; personal use)',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  const rule = RETAILER_RULES[hostname(url)]
  const ruled = rule
    ? {
        title: rule.title && $(rule.title).first().text().trim(),
        price: rule.price && Number($(rule.price).first().text().replace(/[^0-9.]/g, '')),
        image: rule.image && $(rule.image.replace(/::attr\(.*/, '')).first().attr('src'),
      }
    : {}

  const ld = fromJsonLd($)

  const title =
    ruled.title || ld.title || pickMeta($, ['og:title', 'twitter:title']) || $('title').text().trim()
  const image =
    ruled.image || ld.image || pickMeta($, ['og:image', 'og:image:secure_url', 'twitter:image'])
  const price =
    ruled.price ||
    ld.price ||
    Number(pickMeta($, ['product:price:amount', 'og:price:amount'])) ||
    undefined
  const currency =
    ld.currency || pickMeta($, ['product:price:currency', 'og:price:currency']) || 'USD'
  const brand =
    ld.brand || pickMeta($, ['og:site_name']) || hostname(url)

  if (!image) throw new Error('Could not find a product image on that page.')

  return {
    id: `scraper:${Buffer.from(url).toString('base64url').slice(0, 24)}`,
    source: 'scraper',
    retailer: hostname(url),
    title: title || 'Imported product',
    brand,
    price: Number.isFinite(price) ? price : null,
    currency,
    category: 'auto',
    thumbnail: image,
    garmentImage: image,
    productUrl: url,
  }
}

// Imported products are ephemeral (not persisted); list is empty.
export async function list() { return [] }
export async function get() { return null }
