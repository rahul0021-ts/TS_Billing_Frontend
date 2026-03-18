import { useState } from 'react'
import { useAllProducts, useSections, useUpdateProduct, useToggleProduct } from '../hooks/useProducts'
import { parseSizeInput, buildRatesObject } from '../utils/validators'
import AddProductModal from '../components/AddProductModal'

function EditModal({ product, sections, onClose }) {
  const updateProduct = useUpdateProduct()
  const [name, setName] = useState(product.name)
  const [nameHindi, setNameHindi] = useState(product.nameHindi || '')
  const [sizes, setSizes] = useState(product.sizes || [])
  const [rates, setRates] = useState({ ...product.rates })
  const [sizeInput, setSizeInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addSizes() {
    const newSizes = parseSizeInput(sizeInput).filter(s => !sizes.includes(s))
    if (!newSizes.length) return
    setSizes(prev => [...prev, ...newSizes])
    setSizeInput('')
  }

  function removeSize(sz) {
    setSizes(prev => prev.filter(s => s !== sz))
    setRates(prev => { const r = { ...prev }; delete r[sz]; return r })
  }

  async function handleSave() {
    setError('')
    if (!name.trim()) return setError('Name is required')
    if (sizes.length === 0) return setError('Add at least one size')
    setSaving(true)
    try {
      await updateProduct.mutateAsync({ id: product._id, data: { name: name.trim(), nameHindi: nameHindi.trim(), sizes, rates: buildRatesObject(sizes, rates) } })
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-ink-700/50">
          <h2 className="font-display font-bold text-ink-100">Edit Product</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-ink-700 text-ink-400 flex items-center justify-center">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <input className="input text-sm" placeholder="English name" value={name} onChange={e => setName(e.target.value)} />
          <input className="input text-sm" placeholder="हिंदी नाम" value={nameHindi} onChange={e => setNameHindi(e.target.value)} />

          <div className="space-y-2">
            <p className="section-label">Sizes</p>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm font-mono" placeholder="Add sizes" value={sizeInput} onChange={e => setSizeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSizes()} />
              <button onClick={addSizes} className="btn-ghost text-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map(sz => (
                <span key={sz} className="inline-flex items-center gap-1 bg-ink-700 border border-ink-600 text-ink-200 px-2.5 py-1 rounded-full text-xs">
                  {sz}<button onClick={() => removeSize(sz)} className="text-ink-500 hover:text-red-400 ml-0.5">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {sizes.map(sz => (
              <div key={sz} className="flex items-center gap-2 bg-ink-700/50 rounded-xl px-3 py-1.5">
                <span className="text-xs font-mono text-primary-400 w-12">{sz}</span>
                <input type="number" className="flex-1 bg-transparent text-sm font-mono text-ink-100 focus:outline-none" placeholder="₹0" value={rates[sz] || ''} onChange={e => setRates(r => ({ ...r, [sz]: e.target.value }))} />
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-sm">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const { data: products = [], isLoading } = useAllProducts()
  const { data: sections = [] } = useSections()
  const toggleProduct = useToggleProduct()
  const [editProduct, setEditProduct] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [activeSection, setActiveSection] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = products.filter(p => {
    const matchSection = activeSection === 'all' || p.sectionId === activeSection ||
      sections.find(s => s.sectionId === activeSection)?.subsections?.some(sub => sub.id === p.sectionId)
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.nameHindi || '').includes(search)
    return matchSection && matchSearch
  })

  // Group by sectionId
  const grouped = {}
  filtered.forEach(p => {
    const sec = sections.find(s => s.subsections?.some(sub => sub.id === p.sectionId))
    const sub = sec?.subsections?.find(sub => sub.id === p.sectionId)
    const key = sub?.label || p.sectionId
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(p)
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          className="input flex-1 text-sm"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex-shrink-0">+ Add Product</button>
      </div>

      {/* Section filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setActiveSection('all')} className={`chip ${activeSection === 'all' ? 'chip-active' : 'chip-default'}`}>All</button>
        {sections.map(s => (
          <button key={s.sectionId} onClick={() => setActiveSection(s.sectionId)} className={`chip ${activeSection === s.sectionId ? 'chip-active' : 'chip-default'}`}>{s.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-ink-500 text-sm">Loading…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-ink-500 text-sm">No products found</div>
      ) : (
        Object.entries(grouped).map(([label, prods]) => (
          <div key={label}>
            <div className="px-1 py-1.5 mb-1"><span className="section-label">{label}</span></div>
            <div className="card overflow-hidden divide-y divide-ink-700/30">
              {prods.map(product => (
                <div key={product._id} className={`flex items-center gap-3 px-4 py-3 ${!product.isActive ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium text-ink-100 truncate">{product.name}</span>
                      {product.nameHindi && <span className="text-xs text-ink-500">{product.nameHindi}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(product.sizes || []).map(sz => (
                        <span key={sz} className="text-xs font-mono bg-ink-700/60 text-ink-300 px-2 py-0.5 rounded-full">
                          {sz}{product.rates?.[sz] ? ` ₹${product.rates[sz]}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setEditProduct(product)} className="btn-ghost text-xs py-1 px-3">Edit</button>
                    <button
                      onClick={() => toggleProduct.mutate(product._id)}
                      className={`text-xs px-3 py-1 rounded-xl border transition-all ${product.isActive ? 'bg-primary-400/10 border-primary-400/20 text-primary-400' : 'bg-ink-700 border-ink-600 text-ink-500'}`}
                    >
                      {product.isActive ? 'Active' : 'Off'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {editProduct && <EditModal product={editProduct} sections={sections} onClose={() => setEditProduct(null)} />}
      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}