import { useState } from 'react'
import { useSections, useCreateProduct } from '../hooks/useProducts'
import { useBill } from '../hooks/useBill'
import { parseSizeInput, buildRatesObject } from '../utils/validators'

const QUICK_DEFAULTS = [1,3,5,6,10,12,50]

export default function AddProductModal({ onClose }) {
  const { data: sections = [] } = useSections()
  const createProduct           = useCreateProduct()
  const { addItem }             = useBill()

  const [sectionId, setSectionId]           = useState('')
  const [subsectionId, setSubsectionId]     = useState('')
  const [name, setName]                     = useState('')
  const [nameHindi, setNameHindi]           = useState('')
  const [sizeInput, setSizeInput]           = useState('')
  const [sizes, setSizes]                   = useState([])
  const [rates, setRates]                   = useState({})
  const [baseRate, setBaseRate]             = useState('')
  const [defaultQty, setDefaultQty]         = useState(1)

  // Direct bill add (no DB)
  const [directName, setDirectName]             = useState('')
  const [directSize, setDirectSize]             = useState('')
  const [directRate, setDirectRate]             = useState('')
  const [directDefaultQty, setDirectDefaultQty] = useState(1)

  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const selectedSection = sections.find(s => s.sectionId === sectionId)
  const subsections     = selectedSection?.subsections || []

  // Always work with a clean integer
  const dqNum        = Math.max(1, parseInt(defaultQty))
  const directDqNum  = Math.max(1, parseInt(directDefaultQty))

  function addSizes() {
    const newSizes = parseSizeInput(sizeInput).filter(s => !sizes.includes(s))
    if (!newSizes.length) return
    setSizes(prev => [...prev, ...newSizes])
    setSizeInput('')
  }

  function removeSize(size) {
    setSizes(prev => prev.filter(s => s !== size))
    setRates(prev => { const r = { ...prev }; delete r[size]; return r })
  }

  function applyToAll()   { if (!baseRate) return; const r = {}; sizes.forEach(s => r[s] = baseRate); setRates(r) }
  function applyToEmpty() { if (!baseRate) return; setRates(r => { const n = {...r}; sizes.forEach(s => { if (!n[s]) n[s] = baseRate }); return n }) }

  async function handleSave() {
    setError('')
    if (!name.trim())  return setError('Product name is required')
    if (!subsectionId) return setError('Select a sub-section')
    if (!sizes.length) return setError('Add at least one size')
    setSaving(true)
    try {
      await createProduct.mutateAsync({
        name:       name.trim(),
        nameHindi:  nameHindi.trim(),
        sectionId:  subsectionId,
        sizes,
        rates:      buildRatesObject(sizes, rates),
        defaultQty: dqNum,
      })
      setSuccess('Product saved!')
      setTimeout(onClose, 1000)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  function handleDirectAdd() {
    if (!directName.trim())                        return setError('Enter product name')
    if (!directSize.trim())                        return setError('Enter a size')
    if (!directRate || isNaN(Number(directRate)))  return setError('Enter a valid rate')
    setError('')
    addItem({
      productId:  null,
      name:       directName.trim(),
      nameHindi:  '',
      sectionId:  '',
      size:       directSize.trim(),
      rate:       Number(directRate),
      defaultQty: directDqNum,
    })
    setDirectName(''); setDirectSize(''); setDirectRate(''); setDirectDefaultQty(1)
    setSuccess('Added to bill!')
    setTimeout(() => setSuccess(''), 1500)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-ink-700/50">
          <h2 className="font-display font-bold text-ink-100">Add Product</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-ink-700 text-ink-400 flex items-center justify-center">✕</button>
        </div>

        <div className="px-5 py-4 space-y-5">

          {/* ── Quick add to bill (no DB) ── */}
          <div className="bg-primary-400/10 border border-primary-400/20 rounded-2xl p-4 space-y-3">
            <p className="section-label text-xs">Quick Add to Bill (no database)</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input col-span-2 text-sm"
                placeholder="Product name"
                value={directName}
                onChange={e => setDirectName(e.target.value)}
              />
              <input
                className="input text-sm"
                placeholder="Size (e.g. L, 32, Free)"
                value={directSize}
                onChange={e => setDirectSize(e.target.value)}
              />
              <input
                type="number"
                className="input text-sm font-mono"
                placeholder="₹ Rate"
                value={directRate}
                onChange={e => setDirectRate(e.target.value)}
              />
            </div>

            <div>
              <p className="text-xs text-ink-500 mb-1.5">Default quantity</p>
              <div className="flex gap-1.5 flex-wrap items-center">
                {QUICK_DEFAULTS.map(n => (
                  <button
                    key={n}
                    onClick={() => setDirectDefaultQty(n)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-medium border transition-all ${
                      directDqNum === n
                        ? 'bg-primary-400/20 border-primary-400/40 text-primary-400'
                        : 'bg-ink-700 border-ink-600 text-ink-400 hover:border-ink-500'
                    }`}
                  >{n}</button>
                ))}
                <input
                  type="number" min="1" placeholder="Other"
                  value={QUICK_DEFAULTS.includes(directDqNum) ? '' : directDefaultQty}
                  onChange={e => setDirectDefaultQty(e.target.value)}
                  className="input w-20 text-sm font-mono py-1"
                />
              </div>
            </div>

            <button onClick={handleDirectAdd} className="btn-primary w-full text-sm">
              Add to Bill
            </button>
          </div>

          {/* ── Section / subsection ── */}
          <div className="space-y-2">
            <p className="section-label">Section</p>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="input text-sm"
                value={sectionId}
                onChange={e => { setSectionId(e.target.value); setSubsectionId('') }}
              >
                <option value="">— Section —</option>
                {sections.map(s => <option key={s.sectionId} value={s.sectionId}>{s.label}</option>)}
              </select>
              <select
                className="input text-sm"
                value={subsectionId}
                onChange={e => setSubsectionId(e.target.value)}
                disabled={!sectionId}
              >
                <option value="">— Sub-section —</option>
                {subsections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* ── Product names ── */}
          <div className="space-y-2">
            <p className="section-label">Product Name</p>
            <input className="input text-sm" placeholder="English name" value={name} onChange={e => setName(e.target.value)} />
            <input className="input text-sm" placeholder="हिंदी नाम (optional)" value={nameHindi} onChange={e => setNameHindi(e.target.value)} />
          </div>

          {/* ── Default quantity ── */}
          <div className="space-y-2">
            <p className="section-label">
              Default Quantity
              <span className="ml-2 text-ink-500 normal-case font-normal text-xs">
                — auto pre-fills in bill (customer can change freely)
              </span>
            </p>
            <div className="flex gap-1.5 flex-wrap items-center">
              {QUICK_DEFAULTS.map(n => (
                <button
                  key={n}
                  onClick={() => setDefaultQty(n)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all ${
                    dqNum === n
                      ? 'bg-primary-400/20 border-primary-400/40 text-primary-400'
                      : 'bg-ink-700 border-ink-600 text-ink-400 hover:border-ink-500'
                  }`}
                >{n === 1 ? '1 (retail)' : n}</button>
              ))}
              <input
                type="number" min="1" placeholder="Custom"
                value={QUICK_DEFAULTS.includes(dqNum) ? '' : defaultQty}
                onChange={e => setDefaultQty(e.target.value)}
                className="input w-24 text-sm font-mono py-1.5"
              />
            </div>
            <p className="text-xs px-1">
              {dqNum === 1
                ? <span className="text-ink-500">Starts at 1 when added to bill</span>
                : <span className="text-primary-400">Starts at <strong>{dqNum}</strong> when added to bill</span>
              }
            </p>
          </div>

          {/* ── Sizes ── */}
          <div className="space-y-2">
            <p className="section-label">Sizes</p>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm font-mono"
                placeholder="S M L XL  or  28,30,32  or  Free Size"
                value={sizeInput}
                onChange={e => setSizeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSizes()}
              />
              <button onClick={addSizes} className="btn-primary text-sm flex-shrink-0 px-4">Add</button>
            </div>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sizes.map(sz => (
                  <span key={sz} className="inline-flex items-center gap-1 bg-ink-700 border border-ink-600 text-ink-200 px-2.5 py-1 rounded-full text-xs">
                    {sz}
                    <button onClick={() => removeSize(sz)} className="text-ink-500 hover:text-red-400 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Rates ── */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              <p className="section-label">Rates</p>
              <div className="flex gap-2 items-center">
                <input
                  type="number" className="input w-28 text-sm font-mono" placeholder="Base ₹"
                  value={baseRate} onChange={e => setBaseRate(e.target.value)}
                />
                <button onClick={applyToAll}   className="btn-ghost text-xs py-1.5">Apply all</button>
                <button onClick={applyToEmpty} className="btn-ghost text-xs py-1.5">Fill empty</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sizes.map(sz => (
                  <div key={sz} className="flex items-center gap-2 bg-ink-700/50 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-mono text-primary-400 w-12 flex-shrink-0">{sz}</span>
                    <input
                      type="number" className="flex-1 bg-transparent text-sm font-mono text-ink-100 focus:outline-none"
                      placeholder="₹0"
                      value={rates[sz] || ''}
                      onChange={e => setRates(r => ({ ...r, [sz]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error   && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-primary-400 text-sm bg-primary-400/10 border border-primary-400/20 rounded-xl px-3 py-2">{success}</p>}

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-sm">
            {saving ? 'Saving...' : 'Save to Database'}
          </button>
        </div>
      </div>
    </div>
  )
}
