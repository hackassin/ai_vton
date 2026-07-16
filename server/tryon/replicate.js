// Replicate IDM-VTON adapter.  Model: cuuupid/idm-vton
// Docs: https://replicate.com/docs/reference/http#predictions.create
const BASE = 'https://api.replicate.com/v1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function run({ personImage, garmentImage, category }) {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    const err = new Error('REPLICATE_API_TOKEN is not set. Add it to .env or switch TRYON_ENGINE.')
    err.status = 400
    throw err
  }
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const create = await fetch(`${BASE}/predictions`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'wait' },
    body: JSON.stringify({
      version: process.env.REPLICATE_VERSION,
      input: {
        human_img: personImage,   // data URL or public URL
        garm_img: garmentImage,   // public URL
        garment_des: category || 'clothing',
      },
    }),
  })
  if (!create.ok) throw new Error(`Replicate create failed: ${create.status} ${await create.text()}`)
  let pred = await create.json()

  while (pred.status !== 'succeeded' && pred.status !== 'failed' && pred.status !== 'canceled') {
    await sleep(2000)
    const poll = await fetch(`${BASE}/predictions/${pred.id}`, { headers })
    pred = await poll.json()
  }
  if (pred.status !== 'succeeded') {
    throw new Error(`Replicate generation ${pred.status}: ${pred.error || ''}`)
  }
  const image = Array.isArray(pred.output) ? pred.output[0] : pred.output
  return { mode: 'image', image, raw: { id: pred.id } }
}
