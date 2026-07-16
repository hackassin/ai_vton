// Try-on engine registry. Each engine exports:
//   async run({ personImage, garmentImage, category }) -> { image, engine, ... }
// where personImage is a data URL or public URL, garmentImage is a public URL,
// and the returned `image` is a data URL or public URL of the result.
import * as mock from './mock.js'
import * as fashn from './fashn.js'
import * as replicate from './replicate.js'

const ENGINES = { mock, fashn, replicate }

export function activeEngine() {
  const name = (process.env.TRYON_ENGINE || 'mock').toLowerCase()
  return ENGINES[name] ? name : 'mock'
}

export async function runTryOn(input) {
  const name = activeEngine()
  const engine = ENGINES[name]
  const started = Date.now()
  const out = await engine.run(input)
  return { engine: name, ms: Date.now() - started, ...out }
}
