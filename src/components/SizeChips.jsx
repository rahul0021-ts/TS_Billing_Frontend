export default function SizeChips({ sizes, rates, selected, onSelect }) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {sizes.map(size => {
          const rate = rates?.[size]
          const isSelected = selected === size
          return (
            <button
              key={size}
              onClick={() => onSelect(isSelected ? null : size)}
              className={`chip text-xs transition-all duration-100 ${isSelected ? 'chip-active animate-pop' : 'chip-default'}`}
            >
              <span className="font-medium">{size}</span>
              {rate !== undefined && (
                <span className={`${isSelected ? 'text-white/80' : 'text-primary-400'} font-mono`}>
                  ₹{rate}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }