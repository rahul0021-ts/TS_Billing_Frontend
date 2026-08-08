// SizeSelector.jsx
//
// Shows the size list for whichever product was just selected. Picking a
// size is the final trigger that flips the shared keypad into Rate mode
// (handled in useQuickAdd, not here).
//
// Includes a "← ProductName" back header (calls onBack) so QuickAddPage
// can show ONLY this panel in place of ProductSelector once a product is
// picked, instead of stacking both — that's what makes Item + Size act
// like one combined window that swaps content, without needing a
// separate merged component.

import React from "react";

export default function SizeSelector({ sizes, productSelected, selectedProduct, selectedSize, onSelect, onBack }) {
  if (!productSelected) {
    return (
      <div className="card p-3 h-full flex flex-col min-h-0">
        <div className="section-label mb-2">Size</div>
        <div className="text-sm text-ink-500 py-2">Select a product first</div>
      </div>
    );
  }

  return (
    <div className="card p-3 h-full flex flex-col min-h-0">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-ink-100 mb-2 flex-none active:scale-95"
      >
        <span className="text-primary-400 text-base">←</span>
        <span className="truncate">{selectedProduct}</span>
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-3 gap-2 content-start pr-0.5">
        {sizes.map((s) => {
          const isSelected = selectedSize === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className={`min-h-[clamp(48px,9vh,60px)] px-2 flex items-center justify-center rounded-xl border font-semibold text-sm transition-all active:scale-[0.96] ${
                isSelected
                  ? "bg-primary-400/15 border-primary-400 text-primary-400"
                  : "bg-ink-800 border-ink-700 text-ink-100 hover:border-ink-500"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}