// Client-side image helpers.

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Composite a garment over a person photo for the "mock" engine preview.
// Draws the person as a cover-fit background, then overlays the garment scaled
// onto the torso region. Returns a PNG data URL.
export async function compositeOverlay(personSrc, garmentSrc, { width = 720 } = {}) {
  const person = await loadImage(personSrc)
  const ratio = person.height / person.width
  const w = width
  const h = Math.round(width * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(person, 0, 0, w, h)

  try {
    const garment = await loadImage(garmentSrc)
    // Place the garment across the upper-middle torso.
    const gW = w * 0.62
    const gRatio = garment.height / garment.width
    const gH = gW * gRatio
    const gX = (w - gW) / 2
    const gY = h * 0.22
    ctx.globalAlpha = 0.9
    ctx.drawImage(garment, gX, gY, gW, gH)
    ctx.globalAlpha = 1
  } catch {
    /* garment failed to load (e.g. cross-origin) — keep the person photo */
  }
  return canvas.toDataURL('image/png')
}

export function formatPrice(price, currency = 'USD') {
  if (price == null) return ''
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(price)
  } catch {
    return `$${Number(price).toFixed(2)}`
  }
}
