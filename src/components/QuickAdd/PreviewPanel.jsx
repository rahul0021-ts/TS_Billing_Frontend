// PreviewPanel.jsx
//
// Compact ONE-LINE preview — name/size/rate + running total in a single
// row, plus a +/- quantity nudge, instead of a tall multi-row card. This
// is what leaves enough vertical room for the keypad + Item/Size panel +
// Clear/Add buttons to all fit on one phone screen without scrolling.

import React from "react";

export default function PreviewPanel({ product, size, quantity, rate, total, isComplete, onAdjustQuantity }) {
  return (
    <div className={`card px-3 py-2 flex items-center gap-3 ${isComplete ? "border-primary-400/60" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-ink-400 truncate">
          {product || "No item"}
          {size ? ` · ${size}` : ""}
          {rate ? ` · ₹${rate}` : ""}
        </div>
        <div className="font-mono text-lg font-bold text-primary-400 leading-tight">
          ₹{total.toFixed(2)}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-none">
        <button
          type="button"
          onClick={() => onAdjustQuantity(-1)}
          disabled={!quantity || Number(quantity) <= 0}
          className="w-8 h-8 rounded-lg bg-ink-700 text-ink-200 font-bold active:scale-90 transition-all disabled:opacity-30"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="font-mono text-sm font-bold w-6 text-center">{quantity || 0}</span>
        <button
          type="button"
          onClick={() => onAdjustQuantity(1)}
          className="w-8 h-8 rounded-lg bg-ink-700 text-ink-200 font-bold active:scale-90 transition-all"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}