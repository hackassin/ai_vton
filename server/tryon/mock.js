// Mock try-on engine — no API key, no cost. It doesn't run a real diffusion
// model; instead it returns the person photo plus the garment so the client can
// composite a lightweight preview overlay. This exists so the entire app flow
// (browse → pick photo → "try on" → result → save/share) works end-to-end on
// your phone before you plug in a paid AI engine.
export async function run({ personImage, garmentImage }) {
  return {
    mode: 'overlay',
    image: personImage,
    overlay: garmentImage,
    note: 'Preview only. Set TRYON_ENGINE=fashn or =replicate for a photorealistic result.',
  }
}
