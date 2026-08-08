// QuickKeypad.jsx
//
// The ONE and ONLY numeric keypad for the Quick Add page. Self-contained:
// shows its own mode label, the live value being typed, backspace, and a
// clear-field button, all in one card. It never knows whether it's
// entering a quantity or a rate; useQuickAdd decides that based on
// `mode`. Never instantiate a second one.

import React from "react";

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "00", "."];

export default function QuickKeypad({ mode, value, onDigit, onBackspace, onClearField }) {
  const isRateMode = mode === "rate";

  const handleKeyPress = (key) => {
    if (key === "." && !isRateMode) return; // decimals only make sense for rate
    onDigit(key);
  };

  return (
    <div className="card p-3 flex flex-col gap-3" role="group" aria-label="Quick add numeric keypad">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-primary-400 font-medium">
          {isRateMode ? "Rate" : "Quantity"}
        </span>

        <div className="flex-1 text-right font-mono text-2xl font-bold text-ink-50 truncate">
          {isRateMode && value ? "₹" : ""}
          {value || "0"}
        </div>

        <button
          type="button"
          onClick={onBackspace}
          className="w-9 h-9 rounded-xl bg-ink-700 text-primary-400 flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
          aria-label="Backspace"
        >
          ⌫
        </button>

        <button
          type="button"
          onClick={onClearField}
          className="btn-ghost text-xs px-3 py-1.5 flex-shrink-0"
          aria-label={`Clear ${isRateMode ? "rate" : "quantity"}`}
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => {
          const isDecimal = key === ".";
          const decimalDisabled = isDecimal && !isRateMode;

          return (
            <button
              key={key}
              type="button"
              disabled={decimalDisabled}
              onClick={() => handleKeyPress(key)}
              aria-label={key}
              className={[
                "min-h-[clamp(44px,9vh,60px)] rounded-xl text-lg font-semibold transition-all active:scale-95",
                "border border-ink-700 bg-ink-800 text-ink-100 hover:border-primary-400/50",
                decimalDisabled ? "opacity-30 cursor-not-allowed" : "",
              ].join(" ").trim()}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}