export default function SizeChips({ sizes, rates, defaultQty = 1, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sizes.map(size => {
        const rate       = rates?.[size]
        const isSelected = selected === size
        return (
          <button
            key={size}
            onClick={() => onSelect(isSelected ? null : size)}
            className={`chip text-xs transition-all duration-100 ${isSelected ? 'chip-active animate-pop' : 'chip-default'}`}
          >
            <span className="font-medium">{size}</span>
            {rate !== undefined && (
              <span className={`font-mono ${isSelected ? 'text-white/80' : 'text-primary-400'}`}>
                ₹{rate}
              </span>
            )}
            {/* Show default qty as a small hint badge when > 1 */}
            {defaultQty > 1 && (
              <span className={`text-[10px] font-mono px-1 rounded ml-0.5 ${
                isSelected ? 'bg-white/20 text-white/80' : 'bg-ink-700 text-ink-400'
              }`}>
                ×{defaultQty}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
