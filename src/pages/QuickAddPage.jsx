// QuickAddPage.jsx
//
// A standalone, high-speed item-entry page for touch devices — built to
// fit ENTIRELY on a phone screen with no page-level scrolling. Completely
// independent from the existing billing UI — it does not import or
// modify any existing billing component/page/reducer logic, it just
// calls the same `addItem` that ProductGrid / AddProductModal already
// use.
//
// LAYOUT (single column, top to bottom):
//   1. Compact header
//   2. Item/Size "window" — ProductSelector and SizeSelector are never
//      both on screen at once. While no product is picked, this slot
//      renders ProductSelector; the instant a product is tapped, it
//      renders SizeSelector instead (which has its own "← ProductName"
//      back header to return to the item list). Same screen space, does
//      the job of two stacked panels. This is the only part that scrolls
//      internally, and only if a list happens to be long.
//   3. The shared keypad (mode = "quantity" while picking qty/item/size,
//      auto-switches to "rate" once quantity+product+size are all set)
//   4. PreviewPanel — one compact line: name/size/rate + running total +
//      a +/- quantity nudge
//   5. Clear / Add Item — pinned at the very bottom for one-handed,
//      thumb-reach access
//
// INTEGRATION
// Uses your real useBill() hook directly.
//   import QuickAddPage from './pages/QuickAddPage'
//   <Route path="/quick-add" element={<QuickAddPage />} />

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBill } from "../hooks/useBill";
import { useQuickAdd } from "../hooks/useQuickAdd";
import QuickKeypad from "../components/QuickAdd/QuickKeypad";
import ProductSelector from "../components/QuickAdd/ProductSelector";
import SizeSelector from "../components/QuickAdd/SizeSelector";
import PreviewPanel from "../components/QuickAdd/PreviewPanel";

export default function QuickAddPage() {
  const navigate = useNavigate();
  const { addItem, items } = useBill();
  const [justAdded, setJustAdded] = useState("");

  const {
    mode,
    quantity,
    product,
    size,
    rate,
    total,
    isComplete,
    availableProducts,
    availableSizes,
    matchInfo,
    pressDigit,
    pressBackspace,
    pressClearField,
    selectProduct,
    selectSize,
    adjustQuantity,
    cycleMatch,
    reset,
    buildItem,
  } = useQuickAdd();

  const handleAddItem = () => {
    if (!isComplete) return;
    const item = buildItem();
    if (!item) return;
    addItem(item);
    setJustAdded(`${item.name} (${item.size}) × ${item.defaultQty} added!`);
    setTimeout(() => setJustAdded(""), 1200);
    reset();
  };

  const handleClear = () => reset();

  // While no product is picked yet, show the item list. The instant one
  // is picked, show its sizes instead — same slot, never both stacked.
  const showingSizes = Boolean(product);

  return (
    <div className="h-screen flex flex-col bg-ink-900 text-ink-50 overflow-hidden select-none">
      {/* Compact header */}
      <header className="flex-none flex items-center justify-between px-3 py-2 bg-ink-800/80 border-b border-ink-700/50 backdrop-blur sticky top-0 z-40">
        <span className="text-primary-400 font-display font-bold text-base tracking-tight">
          Quick Add
        </span>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-[10px] font-mono bg-ink-700 text-ink-300 border border-ink-600 px-1.5 py-0.5 rounded-full">
              {items.length} in bill
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-ghost min-h-[36px] text-xs px-3"
            aria-label="Back to bill"
          >
            Back
          </button>
        </div>
      </header>

      {/* Everything below fits in one screen — no page scroll */}
      <div className="flex-1 min-h-0 flex flex-col gap-2 p-2 w-full max-w-md mx-auto">
        {/* 1. Item OR Size — same slot, one at a time */}
        <div className="flex-1 min-h-0">
          {showingSizes ? (
            <SizeSelector
              sizes={availableSizes}
              productSelected={true}
              selectedProduct={product}
              selectedSize={size}
              onSelect={selectSize}
              onBack={() => selectProduct(null)}
            />
          ) : (
            <ProductSelector
              products={availableProducts}
              quantity={quantity}
              quantityEntered={Boolean(quantity)}
              matchInfo={matchInfo}
              selectedProduct={product}
              onSelect={selectProduct}
              onCycleMatch={cycleMatch}
            />
          )}
        </div>

        {/* 2. Shared keypad — qty first, then rate */}
        <div className="flex-none">
          <QuickKeypad
            mode={mode}
            value={mode === "quantity" ? quantity : rate}
            onDigit={pressDigit}
            onBackspace={pressBackspace}
            onClearField={pressClearField}
          />
        </div>

        {/* 3. Compact one-line preview */}
        <div className="flex-none">
          <PreviewPanel
            product={product}
            size={size}
            quantity={quantity}
            rate={rate}
            total={total}
            isComplete={isComplete}
            onAdjustQuantity={adjustQuantity}
          />
        </div>

        {justAdded && (
          <p className="flex-none text-primary-400 text-xs bg-primary-400/10 border border-primary-400/20 rounded-lg px-2 py-1 text-center">
            {justAdded}
          </p>
        )}

        {/* 4. Clear / Add — always at the bottom, thumb reach */}
        <div className="flex-none flex gap-2 pb-1">
          <button
            type="button"
            onClick={handleClear}
            className="btn-ghost flex-1 min-h-[52px] text-sm"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!isComplete}
            className="btn-primary flex-1 min-h-[52px] text-sm font-semibold"
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}