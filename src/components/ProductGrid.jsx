import React, { useState, useCallback, memo } from 'react'
import SizeChips from './SizeChips'

function ProductGrid({ products, onAdd, searchQuery }) {
  const [selected, setSelected] = useState({})

  const handleSelect = useCallback((productId, size) => {
    setSelected(prev => {
      if (prev[productId] === size) return prev
      return { ...prev, [productId]: size }
    })
  }, [])

  const handleAdd = useCallback(
    (product) => {
      const size = selected[product._id]
      if (!size) return

      const rate = product.rates?.[size] ?? 0
      const defaultQty = product.defaultQty || 1

      onAdd({
        productId: product._id,
        name: product.name,
        nameHindi: product.nameHindi || '',
        sectionId: product.sectionId,
        size,
        rate,
        defaultQty,
      })

      setSelected(prev => {
        const next = { ...prev }
        delete next[product._id]
        return next
      })
    },
    [selected, onAdd]
  )

  if (!products?.length) {
    return (
      <div className="py-12 text-center text-ink-500 text-sm">
        {searchQuery
          ? `No products matching "${searchQuery}"`
          : 'No products in this section'}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {products.map(product => {
        const defaultQty = product.defaultQty || 1
        const selectedSize = selected[product._id]

        return (
          <div
            key={product._id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-800/60 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-sm font-medium text-ink-100 truncate">
                  {product.name}
                </span>

                {product.nameHindi && (
                  <span className="text-xs text-ink-500 truncate">
                    {product.nameHindi}
                  </span>
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
                selected={selectedSize}
                onSelect={(size) => handleSelect(product._id, size)}
              />
            </div>

            <button
              onClick={() => handleAdd(product)}
              disabled={!selectedSize}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-400/20 hover:bg-primary-400 text-primary-400 hover:text-white font-bold text-lg transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-90"
            >
              +
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default memo(ProductGrid)