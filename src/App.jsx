import { useEffect, useState } from 'react'
import { getHealth } from './api.js'
import Catalog from './components/Catalog.jsx'
import ProductDetail from './components/ProductDetail.jsx'
import TryOnResult from './components/TryOnResult.jsx'

const PERSON_KEY = 'tryon.person'

export default function App() {
  const [view, setView] = useState({ name: 'catalog' })
  const [person, setPerson] = useState(() => localStorage.getItem(PERSON_KEY) || null)
  const [engine, setEngine] = useState(null)

  useEffect(() => {
    getHealth().then((h) => setEngine(h.engine)).catch(() => setEngine('offline'))
  }, [])

  const savePerson = (dataUrl) => {
    setPerson(dataUrl)
    try { localStorage.setItem(PERSON_KEY, dataUrl) } catch { /* quota — keep in memory */ }
  }
  const clearPerson = () => {
    setPerson(null)
    localStorage.removeItem(PERSON_KEY)
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setView({ name: 'catalog' })}>
          <img src="/favicon.svg" alt="" width="26" height="26" />
          <span>Virtual Try-On</span>
        </button>
        {engine && (
          <span className={`engine-badge ${engine === 'mock' ? 'is-mock' : ''}`}>
            {engine === 'offline' ? 'server offline' : `engine: ${engine}`}
          </span>
        )}
      </header>

      <main className="content">
        {view.name === 'catalog' && (
          <Catalog onSelect={(product) => setView({ name: 'product', product })} />
        )}
        {view.name === 'product' && (
          <ProductDetail
            product={view.product}
            person={person}
            onSavePerson={savePerson}
            onClearPerson={clearPerson}
            onBack={() => setView({ name: 'catalog' })}
            onResult={(result) => setView({ name: 'result', result, product: view.product })}
          />
        )}
        {view.name === 'result' && (
          <TryOnResult
            result={view.result}
            product={view.product}
            person={person}
            onBack={() => setView({ name: 'product', product: view.product })}
            onHome={() => setView({ name: 'catalog' })}
          />
        )}
      </main>
    </div>
  )
}
