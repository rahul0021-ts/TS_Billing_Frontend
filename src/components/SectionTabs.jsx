export default function SectionTabs({ sections, active, onSelect }) {
    return (
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {sections.map(sec => (
          <button
            key={sec.sectionId}
            onClick={() => onSelect(sec.sectionId)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              active === sec.sectionId
                ? 'bg-primary-400 text-white shadow-lg shadow-primary-400/20'
                : 'bg-ink-800 text-ink-400 hover:text-ink-200 border border-ink-700'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>
    )
  }