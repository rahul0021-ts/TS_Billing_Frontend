// ProductSelector.jsx
//
// Vertical list of products available for the currently entered quantity
// (driven entirely by quickAddConfig — see useQuickAdd). Each row shows
// "{quantity} {product}" with a checkmark on the selected row.
//
// When the typed quantity has more than one valid configured "pack size"
// (e.g. 36 divides evenly by 12, 6, 4, 3, and 1), a "Try smaller pack"
// button lets the cashier step through every candidate instead of being
// stuck with whichever one happens to be largest.

import React from "react";

// Small best-effort icon lookup so rows don't look bare. Falls back to a
// generic hanger emoji for anything not in the list — purely cosmetic,
// safe to extend or ignore.
const ICONS = {
  shirt: "👕", "t-shirt": "👕", tshirt: "👕",
  pant: "👖", plazo: "👖", lower: "👖", capri: "👖",
  "night pant": "🩳", shorts: "🩳", bloomer: "🩳",
  dhoti: "🧣",
  towel: "🧻", bedsheet: "🛏️", blanket: "🛏️",
  na: "❔",
};

function iconFor(name) {
  return ICONS[name.trim().toLowerCase()] || "👔";
}

export default function ProductSelector({
  products,
  quantity,
  quantityEntered,
  matchInfo,
  selectedProduct,
  onSelect,
  onCycleMatch,
}) {
  const hasMultipleCandidates = (matchInfo?.candidates?.length ?? 0) > 1;

  // Show what tapping the button will switch to, not just a generic
  // "next" label, so the cashier knows before tapping.
  let nextCandidateBase = null;
  if (hasMultipleCandidates) {
    const { candidates, candidateIndex } = matchInfo;
    const nextIndex = (candidateIndex + 1) % candidates.length;
    nextCandidateBase = candidates[nextIndex];
  }

  return (
    <div className="card p-3 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 flex-none gap-2">
        <span className="section-label">Select Item</span>
        {hasMultipleCandidates && (
          <button
            type="button"
            onClick={onCycleMatch}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-ink-700 border border-ink-600 text-primary-400 hover:border-primary-400/50 active:scale-95 transition-all flex-shrink-0"
          >
            ↓ Try {nextCandidateBase}-pc list
          </button>
        )}
      </div>

      {!quantityEntered && (
        <div className="text-sm text-ink-500 py-2">Enter a quantity first</div>
      )}

      {quantityEntered && matchInfo?.type === "multiple" && (
        <div className="text-[11px] text-ink-500 mb-2 -mt-1">
          {quantity} = {matchInfo.multiplier} × {matchInfo.baseQty} — showing the {matchInfo.baseQty}-pc list
        </div>
      )}

      {quantityEntered && matchInfo?.type === "fallback" && (
        <div className="text-[11px] text-ink-300 bg-ink-700/60 border border-ink-600 rounded-lg px-2 py-1 mb-2">
          ⚠ No list configured for {quantity} pcs — showing NA / Free
        </div>
      )}

      {quantityEntered && products.length === 0 && (
        <div className="text-sm text-ink-500 py-2">
          No products configured for this quantity. Add it to{" "}
          <code className="text-ink-300">quickAddConfig.js</code>.
        </div>
      )}

      {quantityEntered && products.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1">
          {products.map((p) => {
            const isSelected = selectedProduct === p.name;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => onSelect(p.name)}
                className={[
                  "min-h-[clamp(48px,9vh,60px)] rounded-xl px-3 flex items-center gap-2.5 border transition-all text-left active:scale-[0.98]",
                  isSelected
                    ? "bg-primary-400/15 border-primary-400 text-primary-400"
                    : "bg-ink-800 border-ink-700 text-ink-100 hover:border-ink-500",
                ].join(" ")}
              >
                <span className="text-lg flex-shrink-0">{iconFor(p.name)}</span>
                <span className="flex-1 font-medium text-sm truncate">
                  {quantity} {p.name}
                </span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-primary-400 text-ink-900 text-xs flex items-center justify-center font-bold flex-shrink-0">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}