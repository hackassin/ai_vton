import { formatPrice } from '../lib/image.js'

export default function ProductCard({ product, onClick }) {
  return (
    <button className="card" onClick={onClick}>
      <div className="card-img">
        <img src={product.thumbnail} alt={product.title} loading="lazy" />
        <span className="retailer-tag">{product.retailer}</span>
      </div>
      <div className="card-body">
        <div className="card-title">{product.title}</div>
        <div className="card-meta">
          <span className="brand">{product.brand}</span>
          {product.price != null && <span className="price">{formatPrice(product.price, product.currency)}</span>}
        </div>
      </div>
    </button>
  )
}
