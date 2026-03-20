import { useState, useMemo } from 'react'
import { useAllProducts, useSections, useProductSearch } from '../hooks/useProducts'
import { useBill } from '../hooks/useBill'
import { useSpeechSearch } from '../hooks/useSpeechSearch'
import SectionTabs from '../components/SectionTabs'
import ProductGrid from '../components/ProductGrid'
import BillPanel from '../components/BillPanel'
import AddProductModal from '../components/AddProductModal'

export default function BillPage() {
  const [activeSection, setActiveSection] = useState('')
  const [search, setSearch]               = useState('')
  const [showAddModal, setShowAddModal]   = useState(false)
  const [showBill, setShowBill]           = useState(false)
  const [micError, setMicError]           = useState('')

  const { data: sections = [],    isLoading: sectionsLoading  } = useSections()
  const { data: allProducts = [], isLoading: productsLoading  } = useAllProducts()
  const { data: searchResults = [] }                            = useProductSearch(search.trim())
  const { addItem, items }                                      = useBill()

  // ── Voice search ────────────────────────────────────────────────────────────
  const { listening, supported: micSupported, start: startMic, stop: stopMic } = useSpeechSearch({
    lang: 'en-IN',           // accepts both Hindi and English words
    onResult: (text) => {
      setSearch(text)
      setMicError('')
    },
    onError: (msg) => {
      setMicError(msg)
      setTimeout(() => setMicError(''), 3000)
    },
  })

  // ── Set default section once loaded ────────────────────────────────────────
  useMemo(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].sectionId)
    }
  }, [sections])

  const activeSecObj = sections.find(s => s.sectionId === activeSection)

  const displayProducts = useMemo(() => {
    if (search.trim()) return searchResults
    if (!activeSection) return allProducts
    return allProducts.filter(p =>
      p.sectionId === activeSection ||
      activeSecObj?.subsections?.some(sub => sub.id === p.sectionId)
    )
  }, [search, searchResults, activeSection, allProducts, activeSecObj])

  const grouped = useMemo(() => {
    if (search.trim()) return [{ label: `Results for "${search}"`, id: 'search', products: displayProducts }]
    if (!activeSecObj) return []
    const groups = []
    if (activeSecObj.subsections?.length) {
      activeSecObj.subsections.forEach(sub => {
        const prods = allProducts.filter(p => p.sectionId === sub.id)
        if (prods.length) groups.push({ label: sub.label, id: sub.id, products: prods })
      })
    } else {
      groups.push({ label: activeSecObj.label, id: activeSecObj.sectionId, products: displayProducts })
    }
    return groups
  }, [displayProducts, activeSecObj, allProducts, search])

  return (
    <div className="flex h-[calc(100vh-57px)]">

      {/* Left: Product selector */}
      <div className={`flex flex-col ${showBill ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-[55%] lg:w-[60%] overflow-hidden border-r border-ink-700/30`}>

        {/* Search + tabs */}
        <div className="px-3 pt-3 pb-2 space-y-2 border-b border-ink-700/30 bg-ink-900/40">
          <div className="relative">

            {/* Search icon */}
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 text-sm pointer-events-none">
              🔍
            </span>

            {/* Search input */}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={listening ? 'Listening…' : 'Search products… (by Rate or by Name)'}
              className={`input pl-9 text-sm transition-all ${
                listening
                  ? 'border-red-400/60 ring-1 ring-red-400/20 placeholder-red-400/70'
                  : ''
              }`}
              style={{ paddingRight: micSupported ? '4.5rem' : '2.5rem' }}
            />

            {/* Clear button — shown when there is text */}
            {search && !listening && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors"
              >✕</button>
            )}

            {/* Mic button */}
            {micSupported && (
              <button
                onClick={listening ? stopMic : startMic}
                title={listening ? 'Stop listening' : 'Search by voice'}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  listening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-ink-700 hover:bg-primary-400/20 text-ink-400 hover:text-primary-400 border border-ink-600'
                }`}
              >
                {listening ? '⏹' : '🎤'}
              </button>
            )}
          </div>

          {/* Mic error message */}
          {micError && (
            <p className="text-xs text-red-400 px-1">{micError}</p>
          )}

          {/* Listening indicator */}
          {listening && (
            <div className="flex items-center gap-2 px-1">
              <span className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-red-400"
                    style={{
                      height: '12px',
                      animation: `bounce 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                    }}
                  />
                ))}
              </span>
              <span className="text-xs text-red-400 font-medium">Listening… speak now</span>
            </div>
          )}

          {!search && (
            <SectionTabs
              sections={sections}
              active={activeSection}
              onSelect={setActiveSection}
            />
          )}
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {(sectionsLoading || productsLoading) ? (
            <div className="flex items-center justify-center h-32 text-ink-500 text-sm">Loading products…</div>
          ) : grouped.length === 0 ? (
            <div className="py-16 text-center text-ink-500 text-sm">No products found</div>
          ) : (
            grouped.map(group => (
              <div key={group.id} className="mb-4">
                <div className="px-3 py-1.5 mb-1">
                  <span className="section-label">{group.label}</span>
                </div>
                <ProductGrid
                  products={group.products}
                  onAdd={addItem}
                  searchQuery={search}
                />
              </div>
            ))
          )}
        </div>

        {/* Add product button */}
        <div className="px-3 py-2 border-t border-ink-700/30 bg-ink-900/40">
          <button onClick={() => setShowAddModal(true)} className="btn-ghost w-full text-sm">
            + Add / Quick Bill Item
          </button>
        </div>
      </div>

      {/* Right: Bill panel */}
      <div className={`${showBill ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[45%] lg:w-[40%]`}>
        <BillPanel />
      </div>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-2xl bg-primary-400 text-white shadow-xl shadow-primary-400/30 flex items-center justify-center text-2xl"
        onClick={() => setShowBill(b => !b)}
      >
        {showBill ? '🛒' : '🧾'}
        {!showBill && items.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
            {items.length}
          </span>
        )}
      </button>

      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}

      {/* Bounce animation for mic bars */}
      <style>{`
        @keyframes bounce {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to   { transform: scaleY(1.2); opacity: 1;   }
        }
      `}</style>
    </div>
  )
}
