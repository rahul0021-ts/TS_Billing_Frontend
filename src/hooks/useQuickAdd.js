// useQuickAdd.js
//
// All Quick Add state + logic lives here, kept separate from the JSX so
// QuickAddPage stays a thin layout component. This hook owns:
//   - the single shared keypad's mode ("quantity" | "rate")
//   - quantity / product / size / rate values
//   - the derived product & size lists (from quickAddConfig)
//   - which configured "pack size" is currently being used to build that
//     list, with a way to step through every valid alternative
//   - the live total
//   - add / clear actions
//
// IMPORTANT: this hook does NOT touch the existing billing logic. It only
// produces a plain item object; QuickAddPage is responsible for handing
// that object to whatever the existing cart's "add item" function is.

import { useState, useMemo, useCallback, useEffect } from "react";
import { quickAddConfig, configuredQuantities } from "../config/quickAddConfig";

export const MODE_QUANTITY = "quantity";
export const MODE_RATE = "rate";

const MAX_QUANTITY_DIGITS = 4; // e.g. up to 9999 pcs
const MAX_RATE_DIGITS = 7; // e.g. up to 99999.99

// Global fallback when the typed quantity has no exact or multiple match
// in quickAddConfig at all. Keeps the cashier from ever hitting a dead
// end — always something tappable.
const FALLBACK_PRODUCT = { name: "NA", sizes: ["NA / Free"] };

export function useQuickAdd() {
  const [mode, setMode] = useState(MODE_QUANTITY);
  const [quantity, setQuantity] = useState(""); // string while editing
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState(null);
  const [rate, setRate] = useState(""); // string while editing

  // Which candidate (index into matchCandidates below) is currently in
  // use. 0 = the largest/most-specific match (the old default
  // behaviour). The "Try smaller pack" button steps this forward.
  const [matchIndex, setMatchIndex] = useState(0);

  // ---- Every configured quantity that evenly divides the typed qty ----
  // Sorted largest-first. A shop stocking 1, 3, 4, 6, 12... will often
  // have several valid readings for one typed number (36 = 3x12, 6x6,
  // 9x4, 12x3, 36x1) — this is the full list of real candidates, not
  // just a single best guess.
  const matchCandidates = useMemo(() => {
    const qtyNum = Number(quantity);
    if (!quantity || !qtyNum) return [];
    return configuredQuantities
      .filter((base) => base > 0 && qtyNum % base === 0)
      .sort((a, b) => b - a);
  }, [quantity]);

  // Reset back to the largest/default match every time the quantity
  // itself changes — cycling only applies to the number currently typed.
  useEffect(() => {
    setMatchIndex(0);
  }, [quantity]);

  // ---- Derived: product list + which match produced it ----
  const { availableProducts, matchInfo } = useMemo(() => {
    const qtyNum = Number(quantity);

    if (!quantity || !qtyNum) {
      return { availableProducts: [], matchInfo: null };
    }

    if (matchCandidates.length === 0) {
      // No exact match and nothing configured divides it evenly either.
      return {
        availableProducts: [FALLBACK_PRODUCT],
        matchInfo: { type: "fallback", candidates: [] },
      };
    }

    const safeIndex = Math.min(matchIndex, matchCandidates.length - 1);
    const baseQty = matchCandidates[safeIndex];
    const isExact = baseQty === qtyNum;

    return {
      availableProducts: quickAddConfig[baseQty].products,
      matchInfo: {
        type: isExact ? "exact" : "multiple",
        baseQty,
        multiplier: qtyNum / baseQty,
        candidates: matchCandidates,
        candidateIndex: safeIndex,
      },
    };
  }, [quantity, matchCandidates, matchIndex]);

  // Step to the next-smaller configured pack size for this quantity,
  // wrapping back around to the largest once you cycle past the end.
  // E.g. for 36 with 1/3/4/6/12 configured: 12 -> 6 -> 4 -> 3 -> 1 -> 12...
  const cycleMatch = useCallback(() => {
    setMatchIndex((i) => {
      if (matchCandidates.length === 0) return 0;
      return (i + 1) % matchCandidates.length;
    });
  }, [matchCandidates.length]);

  // ---- Derived: size list for the selected product ----
  const availableSizes = useMemo(() => {
    if (!product) return [];
    const found = availableProducts.find((p) => p.name === product);
    return found ? found.sizes : [];
  }, [product, availableProducts]);

  // If the quantity (or the chosen pack-size candidate) changes and the
  // previously selected product is no longer in the new list, drop the
  // stale product/size selection so the UI never shows an orphaned pick.
  useEffect(() => {
    if (product && !availableProducts.some((p) => p.name === product)) {
      setProduct(null);
      setSize(null);
    }
  }, [availableProducts, product]);

  // Auto-switch the shared keypad into Rate mode the moment quantity,
  // product AND size are all present — this is the one and only mode
  // transition, per spec ("Never create another keypad").
  useEffect(() => {
    if (quantity && product && size) {
      setMode(MODE_RATE);
    }
  }, [quantity, product, size]);

  // ---- Live total ----
  const total = useMemo(() => {
    const q = Number(quantity) || 0;
    const r = Number(rate) || 0;
    return q * r;
  }, [quantity, rate]);

  const isComplete = Boolean(quantity && product && size && rate);

  // ---- Keypad handlers (the ONE keypad routes to qty or rate by mode) ----
  // `digit` can be a single character ("6") or a short multi-char burst
  // ("00", for fast rupee entry like 6 -> 00 -> "600").
  const pressDigit = useCallback(
    (digit) => {
      if (mode === MODE_QUANTITY) {
        setQuantity((prev) => {
          if (digit === ".") return prev; // no decimals for quantity
          if (prev.length + digit.length > MAX_QUANTITY_DIGITS) return prev;
          return prev === "0" ? digit : prev + digit;
        });
      } else {
        setRate((prev) => {
          if (digit === "." && prev.includes(".")) return prev; // one decimal point
          if (prev.length + digit.length > MAX_RATE_DIGITS) return prev;
          return prev === "0" && digit !== "." ? digit : prev + digit;
        });
      }
    },
    [mode]
  );

  const pressBackspace = useCallback(() => {
    if (mode === MODE_QUANTITY) {
      setQuantity((prev) => prev.slice(0, -1));
    } else {
      setRate((prev) => prev.slice(0, -1));
    }
  }, [mode]);

  const pressClearField = useCallback(() => {
    if (mode === MODE_QUANTITY) {
      setQuantity("");
    } else {
      setRate("");
    }
  }, [mode]);

  // ---- Selection handlers ----
  const selectProduct = useCallback((name) => {
    setProduct(name);
    setSize(null); // picking a new product always clears the old size
    setMode(MODE_QUANTITY); // stay/return to quantity mode until size is picked
  }, []);

  const selectSize = useCallback((value) => {
    setSize(value); // the useEffect above flips mode -> rate once this lands
  }, []);

  // Quick +/- nudge on the Preview panel. Works on top of whatever the
  // number pad already typed — it directly adjusts the committed
  // `quantity` value. Product/size reset automatically via the effect
  // above if the new quantity no longer has that product configured.
  const adjustQuantity = useCallback((delta) => {
    setQuantity((prev) => {
      const next = Math.max(0, (Number(prev) || 0) + delta);
      return next === 0 ? "" : String(next);
    });
  }, []);

  // ---- Reset everything back to the start of the 4-step flow ----
  const reset = useCallback(() => {
    setQuantity("");
    setProduct(null);
    setSize(null);
    setRate("");
    setMode(MODE_QUANTITY);
    setMatchIndex(0);
  }, []);

  // ---- Build the item to hand off to the existing billing/cart ----
  //
  // Shaped to match exactly what ProductGrid / AddProductModal pass to
  // useBill().addItem(): { productId, name, nameHindi, sectionId, size, rate, defaultQty }
  //
  // AddProductModal's own "Quick Add to Bill (no database)" flow already
  // establishes the convention for off-catalog items: productId: null and
  // sectionId: '' (empty, not a custom label). We follow that exact
  // convention so receipts/bill panel treat these lines identically to
  // items added that way, instead of introducing a second convention.
  //
  // Leaving productId falsy also means BillContext's ADD_ITEM reducer
  // (which only merges into an existing line when `item.productId` is
  // truthy) always creates a fresh bill line here, using `defaultQty` as
  // the line's starting qty — exactly the quantity the cashier typed.
  const buildItem = useCallback(() => {
    if (!isComplete) return null;
    return {
      productId: null,
      name: product,
      nameHindi: "",
      sectionId: "",
      size,
      rate: Number(rate),
      defaultQty: Number(quantity),
    };
  }, [isComplete, product, size, quantity, rate]);

  return {
    // state
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
    // keypad actions
    pressDigit,
    pressBackspace,
    pressClearField,
    // selection actions
    selectProduct,
    selectSize,
    adjustQuantity,
    cycleMatch,
    // lifecycle
    reset,
    buildItem,
  };
}