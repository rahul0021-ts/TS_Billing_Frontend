import { useState } from 'react'
import SizeChips from './SizeChips'

export default function ProductGrid({ products, onAdd, searchQuery }) {
  const [selected, setSelected] = useState({})

  function handleSelect(productId, size) {
    setSelected(prev => ({ ...prev, [productId]: size }))
  }

  function handleAdd(product) {
    const size       = selected[product._id]
    if (!size) return
    const rate       = product.rates?.[size] ?? 0
    const defaultQty = product.defaultQty || 1
    onAdd({
      productId:  product._id,
      name:       product.name,
      nameHindi:  product.nameHindi || '',
      sectionId:  product.sectionId,
      size,
      rate,
      defaultQty,  // passed so BillContext can pre-fill qty
    })
    setSelected(prev => ({ ...prev, [product._id]: null }))
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-12 text-center text-ink-500 text-sm">
        {searchQuery ? `No products matching "${searchQuery}"` : 'No products in this section'}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {products.map(product => {
        const defaultQty = product.defaultQty || 1
        return (
          <div
            key={product._id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-800/60 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-sm font-medium text-ink-100 truncate">{product.name}</span>
                {product.nameHindi && (
                  <span className="text-xs text-ink-500 truncate">{product.nameHindi}</span>
                )}
                {defaultQty > 1 && (
                  <span className="text-[10px] font-mono bg-ink-700 text-ink-400 border border-ink-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    default {defaultQty}
                  </span>
                )}
              </div>
              <SizeChips
                sizes={product.sizes || []}
                rates={product.rates}
                defaultQty={defaultQty}
                selected={selected[product._id]}
                onSelect={size => handleSelect(product._id, size)}
              />
            </div>
            <button
              onClick={() => handleAdd(product)}
              disabled={!selected[product._id]}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-400/20 hover:bg-primary-400 text-primary-400 hover:text-white font-bold text-lg transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-90"
            >+</button>
          </div>
        )
      })}
    </div>
  )
}
