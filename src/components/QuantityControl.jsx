import { useState } from 'react'
import { getNextStep, getPrevStep, clampQty } from '../utils/qtySteps'

export default function QuantityControl({ qty, onChange, steps }) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw]         = useState('')

  function handlePlus()  { onChange(getNextStep(qty, steps)) }
  function handleMinus() { onChange(getPrevStep(qty, steps)) }

  function handleFocus() { setEditing(true);  setRaw(String(qty)) }
  function handleBlur()  { setEditing(false); onChange(clampQty(raw)) }
  function handleKeyDown(e) { if (e.key === 'Enter') e.target.blur() }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={handleMinus}
        className="w-7 h-7 rounded-lg bg-ink-700 hover:bg-ink-600 text-ink-200 font-mono text-base flex items-center justify-center transition-colors active:scale-90"
      >−</button>
      <input
        type="number"
        min="1"
        max="9999"
        value={editing ? raw : qty}
        onChange={e => setRaw(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-12 h-7 text-center bg-ink-700 border border-ink-600 rounded-lg text-sm font-mono text-ink-50 focus:outline-none focus:border-primary-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={handlePlus}
        className="w-7 h-7 rounded-lg bg-ink-700 hover:bg-ink-600 text-ink-200 font-mono text-base flex items-center justify-center transition-colors active:scale-90"
      >+</button>
    </div>
  )
}
