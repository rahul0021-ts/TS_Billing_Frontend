import { useState, useMemo } from 'react'
import { useBill } from '../hooks/useBill'
import { useSettings } from '../hooks/useSettings'
import { useWhatsApp } from '../hooks/useWhatsApp'
import QuantityControl from './QuantityControl'
import CustomerForm from './CustomerForm'
import BillPreviewModal from './BillPreviewModal'
import { formatForWhatsApp } from '../utils/receiptFormatter'

const SPLIT_METHODS = ['cash', 'upi', 'card']
const SPLIT_LABELS  = { cash: 'Cash', upi: 'UPI', card: 'Card' }
const SPLIT_ICONS   = { cash: '💵', upi: '📲', card: '💳' }

export default function BillPanel() {
  const { items, billNo, customerPhone, subtotal, qtySteps, isGenerating, generateBill, removeItem, setQty, clearBill } = useBill()
  const { settings } = useSettings()
  const { sendViaLink } = useWhatsApp()

  const [discount, setDiscount]           = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [splits, setSplits]               = useState({ cash: '', upi: '', card: '', other: '' })
  const [generatedBill, setGeneratedBill] = useState(null)
  const [showPreview, setShowPreview]     = useState(false)
  const [error, setError]                 = useState('')

  const total    = Math.max(0, subtotal - discount)
  const isMix    = paymentMethod === 'Mix'

  // live split totals
  const splitTotal     = useMemo(() =>
    SPLIT_METHODS.reduce((s, m) => s + (parseFloat(splits[m]) || 0), 0),
  [splits])
  const splitRemaining = useMemo(() =>
    Math.round((total - splitTotal) * 100) / 100,
  [total, splitTotal])
  const splitBalanced  = Math.abs(splitRemaining) < 0.5

  function setSplit(method, val) {
    setSplits(prev => ({ ...prev, [method]: val }))
  }

  function autoFill(method) {
    const others = SPLIT_METHODS
      .filter(m => m !== method)
      .reduce((s, m) => s + (parseFloat(splits[m]) || 0), 0)
    const rem = Math.max(0, Math.round((total - others) * 100) / 100)
    setSplits(prev => ({ ...prev, [method]: String(rem) }))
  }

  function buildPaymentString() {
    if (!isMix) return paymentMethod
    const active = SPLIT_METHODS.filter(m => parseFloat(splits[m]) > 0)
    if (!active.length) return 'cash'
    if (active.length === 1) return active[0]
    return active.map(m => `${SPLIT_LABELS[m]} ₹${splits[m]}`).join(' + ')
  }

  function handleMethodClick(m) {
    setPaymentMethod(m)
    setError('')
    if (m !== 'Mix') setSplits({ cash: '', upi: '', card: ''})
  }

  async function handleGenerate() {
    setError('')
    if (isMix && !splitBalanced) {
      setError(`Split must equal ₹${total}. ₹${splitRemaining > 0 ? splitRemaining + ' remaining' : Math.abs(splitRemaining) + ' over'}`)
      return
    }
    try {
      const bill = await generateBill({ discount, paymentMethod: buildPaymentString() })
      setGeneratedBill(bill)
      setShowPreview(true)
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create bill')
    }
  }

  function handleWhatsApp() {
    if (!customerPhone) { setError('Enter customer WhatsApp number first'); return }
    const fakeBill = {
      billNo: billNo || '---',
      customer: { name: '', phone: customerPhone },
      items, subtotal, discount, total,
      paymentMethod: buildPaymentString(),
    }
    sendViaLink(customerPhone, formatForWhatsApp(fakeBill, settings))
  }

  function handleNewBill() {
    setGeneratedBill(null)
    setDiscount(0)
    setPaymentMethod('cash')
    setSplits({ cash: '', upi: '', card: ''})
    setError('')
    clearBill()
  }

  return (
    <>
      <div className="flex flex-col h-full bg-ink-800/40 border-l border-ink-700/50">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-ink-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="section-label">Bill</span>
              {billNo && <span className="font-mono text-primary-400 font-bold text-sm">#{billNo}</span>}
            </div>
            <span className="text-xs text-ink-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>
          <CustomerForm />
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-ink-600">
              <div className="text-4xl mb-3">🧾</div>
              <p className="text-sm">Select sizes from the left to add items</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                  idx % 2 === 0 ? 'bg-ink-800/30' : 'bg-transparent'
                } group animate-slide-in`}
              >
                <span className="w-5 text-xs text-ink-600 font-mono flex-shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink-100 truncate text-xs leading-tight">{item.name}</div>
                  {item.nameHindi && <div className="text-ink-500 text-xs truncate">{item.nameHindi}</div>}
                  <div className="text-primary-400 font-mono text-xs">{item.size}</div>
                </div>
                <QuantityControl qty={item.qty} onChange={qty => setQty(item.id, qty)} steps={qtySteps} />
                <div className="text-right flex-shrink-0 w-16">
                  <div className="text-xs text-ink-500 font-mono">₹{item.rate}</div>
                  <div className="font-semibold text-ink-100 font-mono text-sm">₹{Math.round(item.qty * item.rate)}</div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-red-900/60 text-ink-500 hover:text-red-400 flex items-center justify-center text-xs transition-all flex-shrink-0"
                >✕</button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-ink-700/50 px-4 pt-3 pb-4 space-y-3">

          {/* Subtotal / discount / total */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm text-ink-400">
              <span>Subtotal</span>
              <span className="font-mono">₹{subtotal}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-400">Discount</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={e => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 text-right bg-ink-700 border border-ink-600 text-ink-100 rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:border-primary-400"
              />
            </div>
            <div className="flex items-center justify-between text-base font-bold">
              <span className="text-ink-100">Total</span>
              <span className="font-mono text-primary-400 text-lg">₹{total}</span>
            </div>
          </div>

          {/* Payment method tabs */}
          <div className="flex gap-1.5">
            {['cash', 'upi', 'Mix'].map(m => (
              <button
                key={m}
                onClick={() => handleMethodClick(m)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  paymentMethod === m
                    ? m === 'Mix'
                      ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                      : 'bg-primary-400/20 text-primary-400 border border-primary-400/40'
                    : 'bg-ink-700 text-ink-400 border border-ink-600 hover:border-ink-500'
                }`}
              >
                {m === 'upi' ? 'UPI' : m === 'Mix' ? '⚡ Mix' : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Mix split panel — only shown when Mix is selected */}
          {isMix && (
            <div className="bg-ink-900/50 border border-amber-400/20 rounded-2xl p-3 space-y-2 animate-slide-in">
              <p className="text-xs text-amber-400 font-medium mb-1">Split payment</p>

              {SPLIT_METHODS.map(m => (
                <div key={m} className="flex items-center gap-2">
                  <span className="text-base w-5 flex-shrink-0 text-center">{SPLIT_ICONS[m]}</span>
                  <span className="text-xs text-ink-300 w-9 flex-shrink-0">{SPLIT_LABELS[m]}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={splits[m]}
                    onChange={e => setSplit(m, e.target.value)}
                    className="flex-1 bg-ink-700 border border-ink-600 rounded-xl px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary-400 text-right"
                  />
                  {/* auto-fill remaining button */}
                  <button
                    onClick={() => autoFill(m)}
                    title={`Set ₹${splitRemaining} remaining`}
                    className="flex-shrink-0 w-7 h-7 rounded-lg bg-ink-700 hover:bg-amber-400/20 text-ink-500 hover:text-amber-400 border border-ink-600 flex items-center justify-center text-xs transition-all"
                  >↙</button>
                </div>
              ))}

              {/* Balance row */}
              <div className={`flex justify-between items-center pt-1.5 border-t border-ink-700/40 text-xs font-mono font-semibold ${
                splitBalanced ? 'text-primary-400'
                : splitRemaining > 0 ? 'text-amber-400'
                : 'text-red-400'
              }`}>
                <span>
                  {splitBalanced
                    ? '✓ Balanced'
                    : splitRemaining > 0
                      ? `₹${splitRemaining} remaining`
                      : `₹${Math.abs(splitRemaining)} over`}
                </span>
                <span>₹{Math.round(splitTotal * 100) / 100} / ₹{total}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-xs bg-red-900/20 border border-red-800/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleGenerate}
              disabled={items.length === 0 || isGenerating}
              className="btn-primary col-span-1 text-xs py-2.5"
            >
              {isGenerating ? '...' : 'Bill बनाएं'}
            </button>
            <button
              onClick={handleWhatsApp}
              disabled={items.length === 0}
              className="btn-wa col-span-1 text-xs py-2.5"
            >
              WhatsApp
            </button>
            <button
              onClick={handleNewBill}
              className="btn-ghost col-span-1 text-xs py-2.5"
            >
              नया Bill
            </button>
          </div>
        </div>
      </div>

      {showPreview && generatedBill && (
        <BillPreviewModal
          bill={generatedBill}
          settings={settings}
          onClose={() => setShowPreview(false)}
          onNew={() => { setShowPreview(false); handleNewBill() }}
        />
      )}
    </>
  )
}
