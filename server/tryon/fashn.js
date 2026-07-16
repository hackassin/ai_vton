// FASHN.ai virtual try-on adapter.  Docs: https://docs.fashn.ai
// Flow: POST /v1/run -> { id }, then poll GET /v1/status/:id until completed.
const BASE = 'https://api.fashn.ai/v1'

// FASHN wants images as URLs or base64. Our personImage may be a data URL
// (data:image/...;base64,xxxx) — FASHN accepts the base64 payload directly.
function toBase64OrUrl(img) {
  if (typeof img === 'string' && img.startsWith('data:')) {
    return img.split(',', 2)[1] // strip the data-URL prefix
  }
  return img
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function run({ personImage, garmentImage, category }) {
  const key = process.env.FASHN_API_KEY
  if (!key) {
    const err = new Error('FASHN_API_KEY is not set. Add it to .env or switch TRYON_ENGINE.')
    err.status = 400
    throw err
  }
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

  const start = await fetch(`${BASE}/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model_name: process.env.FASHN_MODEL || 'tryon-v1.6',
      inputs: {
        model_image: toBase64OrUrl(personImage),
        garment_image: toBase64OrUrl(garmentImage),
        category: category || 'auto',
      },
    }),
  })
  if (!start.ok) throw new Error(`FASHN run failed: ${start.status} ${await start.text()}`)
  const { id, error } = await start.json()
  if (error) throw new Error(`FASHN error: ${JSON.stringify(error)}`)

  // Poll for completion (FASHN typically finishes in ~10-40s).
  for (let i = 0; i < 60; i++) {
    await sleep(2000)
    const s = await fetch(`${BASE}/status/${id}`, { headers })
    if (!s.ok) throw new Error(`FASHN status failed: ${s.status}`)
    const data = await s.json()
    if (data.status === 'completed') {
      return { mode: 'image', image: data.output?.[0], raw: data }
    }
    if (data.status === 'failed') {
      throw new Error(`FASHN generation failed: ${JSON.stringify(data.error)}`)
    }
  }
  throw new Error('FASHN generation timed out')
}
