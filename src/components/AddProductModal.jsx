import { useState, useRef, useCallback } from 'react'
import { useSections, useCreateProduct } from '../hooks/useProducts'
import { useBill } from '../hooks/useBill'
import { parseSizeInput, buildRatesObject } from '../utils/validators'

const QUICK_DEFAULTS = [1,3,5,6,10,12,50]

// ── Voice parser ─────────────────────────────────────────────────────────────
function parseVoiceInput(transcript) {
  let text = transcript.trim()

  // ── 1. Marathi/Hindi number words → digits ────────────────────────────────
  const marathiNumbers = {
    // Special compound words
    'अडीचशे':'250','दीडशे':'150','पावणेदोनशे':'175','सव्वाशे':'125',
    'पावणेतीनशे':'275','सव्वादोनशे':'225',
    // Hundreds
    'नऊशे':'900','आठशे':'800','सातशे':'700','सहाशे':'600',
    'पाचशे':'500','चारशे':'400','तीनशे':'300','दोनशे':'200','एकशे':'100',
    // Nineties–tens
    'नव्याण्णव':'99','अठ्ठ्याण्णव':'98','सत्त्याण्णव':'97','शहाण्णव':'96',
    'पंच्याण्णव':'95','चौऱ्याण्णव':'94','त्र्याण्णव':'93','ब्याण्णव':'92',
    'एक्याण्णव':'91','नव्वद':'90','एक्याऐंशी':'81','ऐंशी':'80',
    'एकोणऐंशी':'79','पंचाहत्तर':'75','सत्तर':'70','पासष्ट':'65','साठ':'60',
    'पंचावन्न':'55','पन्नास':'50','पंचेचाळीस':'45','चाळीस':'40',
    'पस्तीस':'35','तीस':'30','पंचवीस':'25','वीस':'20',
    'एकोणीस':'19','अठरा':'18','सतरा':'17','सोळा':'16','पंधरा':'15',
    'चौदा':'14','तेरा':'13','बारा':'12','अकरा':'11','दहा':'10',
    'नऊ':'9','आठ':'8','सात':'7','सहा':'6','पाच':'5',
    'चार':'4','तीन':'3','दोन':'2','एक':'1',
  }

  // Replace longest matches first
  for (const w of Object.keys(marathiNumbers).sort((a,b) => b.length - a.length)) {
    text = text.replace(new RegExp(w, 'g'), ' ' + marathiNumbers[w] + ' ')
  }

  // Combine adjacent hundred+tens: "100 20" → "120", "300 50" → "350"
  text = text.replace(/\b(100|200|300|400|500|600|700|800|900)\s+(\d{1,2})\b/g,
    (_, h, t) => String(parseInt(h) + parseInt(t))
  )

  // Remove noise words
  text = text
    .replace(/\b(size|rate|rupees?|rupaye|rs|rupe|ka|ki|ke|ahe|pcs|pieces?|nos?|items?|price|at|the|a|an|of|for|and)\b/gi, ' ')
    .replace(/[,;.!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  const tokens = text.split(/\s+/).filter(Boolean)
  if (!tokens.length) return { qty: '', name: '', size: '', rate: '' }

  // ── 2. Size detector ──────────────────────────────────────────────────────
  function matchSize(tok) {
    if (!tok) return null
    if (/^\d{2,3}x\d{2,3}$/i.test(tok))   return tok.toUpperCase()
    if (/^(free|freesize)$/i.test(tok))    return 'Free Size'
    if (/^(xxl|xl|xs|s|m|l)$/i.test(tok)) return tok.toUpperCase()
    if (/^\d+$/.test(tok)) {
      const n = parseInt(tok)
      if ((n >= 18 && n <= 44) || (n >= 70 && n <= 100)) return String(n)
    }
    return null
  }

  const digitTokens = tokens.filter(t => /^\d+$/.test(t))
  let i = 0, qty = '', size = '', rate = ''
  const nameWords = []

  // QTY = first digit token (always if 2+ digits; only if not-size if 1 digit)
  if (/^\d+$/.test(tokens[i])) {
    if (!matchSize(tokens[i]) || digitTokens.length >= 2) {
      qty = tokens[i]; i++
    }
  }

  // RATE = last digit token (not a size, or if multiple digits definitely last)
  let rateIdx = -1
  for (let j = tokens.length - 1; j >= i; j--) {
    if (/^\d+$/.test(tokens[j])) {
      if (!matchSize(tokens[j]) || digitTokens.length >= 2) {
        rate = tokens[j]; rateIdx = j; break
      }
    }
  }

  // SIZE = first size-matching token between qty and rate
  let sizeIdx = -1
  const scanEnd = rateIdx >= 0 ? rateIdx : tokens.length
  for (let j = i; j < scanEnd; j++) {
    const s = matchSize(tokens[j])
    if (s) { size = s; sizeIdx = j; break }
  }

  // NAME = word tokens between qty and size (or rate)
  const nameEnd = sizeIdx >= 0 ? sizeIdx : (rateIdx >= 0 ? rateIdx : tokens.length)
  for (let j = i; j < nameEnd; j++) {
    if (!/^\d+$/.test(tokens[j])) nameWords.push(tokens[j])
  }

  const name = nameWords
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return { qty: qty || '', name: name || '', size: size || '', rate: rate || '' }
}

function usePushToTalk({ onResult, onError }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window

  const startListening = useCallback(() => {
    if (!supported) { onError('Mic not supported. Use Chrome.'); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.lang = 'mr-IN'
    r.continuous = false
    r.interimResults = false
    r.maxAlternatives = 1
    r.onstart  = () => setListening(true)
    r.onresult = (e) => onResult(e.results[0][0].transcript.trim())
    r.onerror  = (e) => {
      setListening(false)
      if (e.error === 'not-allowed') onError('Mic permission denied')
      else if (e.error === 'no-speech') onError('No speech detected')
      else onError(`Mic error: ${e.error}`)
    }
    r.onend = () => setListening(false)
    recognitionRef.current = r
    r.start()
  }, [supported, onResult, onError])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, supported, startListening, stopListening }
}

export default function AddProductModal({ onClose }) {
  const { data: sections = [] } = useSections()
  const createProduct           = useCreateProduct()
  const { addItem }             = useBill()

  const [sectionId, setSectionId]           = useState('')
  const [subsectionId, setSubsectionId]     = useState('')
  const [name, setName]                     = useState('')
  const [nameHindi, setNameHindi]           = useState('')
  const [sizeInput, setSizeInput]           = useState('')
  const [sizes, setSizes]                   = useState([])
  const [rates, setRates]                   = useState({})
  const [baseRate, setBaseRate]             = useState('')
  const [defaultQty, setDefaultQty]         = useState(1)

  const [directName, setDirectName]             = useState('')
  const [directSize, setDirectSize]             = useState('')
  const [directRate, setDirectRate]             = useState('')
  const [directDefaultQty, setDirectDefaultQty] = useState(1)
  const [micTranscript, setMicTranscript]       = useState('')
  const [micError, setMicError]                 = useState('')

  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const selectedSection = sections.find(s => s.sectionId === sectionId)
  const subsections     = selectedSection?.subsections || []
  const dqNum           = Math.max(1, parseInt(defaultQty)       || 1)
  const directDqNum     = Math.max(1, parseInt(directDefaultQty) || 1)

  // ── Push-to-talk ─────────────────────────────────────────────────────────
  const { listening, supported: micSupported, startListening, stopListening } = usePushToTalk({
    onResult: (text) => {
      setMicTranscript(text)
      setMicError('')
      const parsed = parseVoiceInput(text)
      if (parsed.name)  setDirectName(parsed.name)
      if (parsed.size)  setDirectSize(parsed.size)
      if (parsed.rate)  setDirectRate(parsed.rate)
      if (parsed.qty)   setDirectDefaultQty(parseInt(parsed.qty))
    },
    onError: (msg) => {
      setMicError(msg)
      setTimeout(() => setMicError(''), 3000)
    },
  })

  function handleMicPress(e) {
    e.preventDefault()
    setMicTranscript('')
    setMicError('')
    startListening()
  }

  function handleMicRelease(e) {
    e.preventDefault()
    stopListening()
  }

  function addSizes() {
    const newSizes = parseSizeInput(sizeInput).filter(s => !sizes.includes(s))
    if (!newSizes.length) return
    setSizes(prev => [...prev, ...newSizes])
    setSizeInput('')
  }

  function removeSize(size) {
    setSizes(prev => prev.filter(s => s !== size))
    setRates(prev => { const r = { ...prev }; delete r[size]; return r })
  }

  function applyToAll()   { if (!baseRate) return; const r = {}; sizes.forEach(s => r[s] = baseRate); setRates(r) }
  function applyToEmpty() { if (!baseRate) return; setRates(r => { const n = {...r}; sizes.forEach(s => { if (!n[s]) n[s] = baseRate }); return n }) }

  async function handleSave() {
    setError('')
    if (!name.trim())  return setError('Product name is required')
    if (!subsectionId) return setError('Select a sub-section')
    if (!sizes.length) return setError('Add at least one size')
    setSaving(true)
    try {
      await createProduct.mutateAsync({
        name: name.trim(), nameHindi: nameHindi.trim(),
        sectionId: subsectionId, sizes,
        rates: buildRatesObject(sizes, rates),
        defaultQty: dqNum,
      })
      setSuccess('Product saved!')
      setTimeout(onClose, 1000)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save product')
    } finally { setSaving(false) }
  }

  function handleDirectAdd() {
    if (!directName.trim())                       return setError('Enter product name')
    if (!directSize.trim())                       return setError('Enter a size')
    if (!directRate || isNaN(Number(directRate))) return setError('Enter a valid rate')
    setError('')
    addItem({
      productId: null, name: directName.trim(), nameHindi: '',
      sectionId: '', size: directSize.trim(),
      rate: Number(directRate), defaultQty: directDqNum,
    })
    setDirectName(''); setDirectSize(''); setDirectRate('')
    setDirectDefaultQty(1); setMicTranscript('')
    setSuccess('Added to bill!')
    setTimeout(() => setSuccess(''), 1500)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-ink-700/50">
          <h2 className="font-display font-bold text-ink-100">Add Product</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-ink-700 text-ink-400 flex items-center justify-center">✕</button>
        </div>

        <div className="px-5 py-4 space-y-5">

          {/* ── Quick add to bill ── */}
          <div className="bg-primary-400/10 border border-primary-400/20 rounded-2xl p-4 space-y-3">
            <p className="section-label text-xs">Quick Add to Bill (no database)</p>

            {/* Push-to-talk mic */}
            {micSupported && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onMouseDown={handleMicPress}
                    onMouseUp={handleMicRelease}
                    onTouchStart={handleMicPress}
                    onTouchEnd={handleMicRelease}
                    onContextMenu={e => e.preventDefault()}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm select-none transition-all ${
                      listening
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                        : 'bg-ink-700 text-ink-300 border border-ink-600 hover:border-primary-400/50 active:scale-95'
                    }`}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                  >
                    <span className="text-base">{listening ? '⏺' : '🎤'}</span>
                    <span>{listening ? 'Listening…' : 'Hold to speak'}</span>
                  </button>

                  {/* Animated bars */}
                  {listening && (
                    <div className="flex items-center gap-0.5 h-5">
                      {[0,1,2,3,4].map(i => (
                        <span key={i} className="w-1 rounded-full bg-red-400"
                          style={{ height: '12px', animation: `micbar 0.5s ease-in-out ${i*0.1}s infinite alternate` }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Transcript */}
                  {micTranscript && !listening && (
                    <span className="text-xs text-ink-400 italic truncate max-w-[150px]">
                      "{micTranscript}"
                    </span>
                  )}
                </div>

                {micError && <p className="text-xs text-red-400">{micError}</p>}

                <p className="text-xs text-ink-600">
                  Say: <span className="text-ink-400 font-mono">"6 Towel 54"</span>
                  {' '} or <span className="text-ink-400 font-mono">"12 Dhoti XL 75"</span>
                </p>
              </div>
            )}

            {/* Input fields — auto-filled by mic or manual */}
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input col-span-2 text-sm"
                placeholder="Product name"
                value={directName}
                onChange={e => setDirectName(e.target.value)}
              />
              <input
                className="input text-sm"
                placeholder="Size (e.g. L, 32, Free)"
                value={directSize}
                onChange={e => setDirectSize(e.target.value)}
              />
              <input
                type="number"
                className="input text-sm font-mono"
                placeholder="₹ Rate"
                value={directRate}
                onChange={e => setDirectRate(e.target.value)}
              />
            </div>

            {/* Default qty */}
            <div>
              <p className="text-xs text-ink-500 mb-1.5">Default quantity</p>
              <div className="flex gap-1.5 flex-wrap items-center">
                {QUICK_DEFAULTS.map(n => (
                  <button
                    key={n}
                    onClick={() => setDirectDefaultQty(n)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-medium border transition-all ${
                      directDqNum === n
                        ? 'bg-primary-400/20 border-primary-400/40 text-primary-400'
                        : 'bg-ink-700 border-ink-600 text-ink-400 hover:border-ink-500'
                    }`}
                  >{n}</button>
                ))}
                <input
                  type="number" min="1" placeholder="Other"
                  value={QUICK_DEFAULTS.includes(directDqNum) ? '' : directDefaultQty}
                  onChange={e => setDirectDefaultQty(e.target.value)}
                  className="input w-20 text-sm font-mono py-1"
                />
              </div>
            </div>

            <button onClick={handleDirectAdd} className="btn-primary w-full text-sm">
              Add to Bill
            </button>
          </div>

          {/* ── Section / subsection ── */}
          <div className="space-y-2">
            <p className="section-label">Section</p>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="input text-sm"
                value={sectionId}
                onChange={e => { setSectionId(e.target.value); setSubsectionId('') }}
              >
                <option value="">— Section —</option>
                {sections.map(s => <option key={s.sectionId} value={s.sectionId}>{s.label}</option>)}
              </select>
              <select
                className="input text-sm"
                value={subsectionId}
                onChange={e => setSubsectionId(e.target.value)}
                disabled={!sectionId}
              >
                <option value="">— Sub-section —</option>
                {subsections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* ── Product names ── */}
          <div className="space-y-2">
            <p className="section-label">Product Name</p>
            <input className="input text-sm" placeholder="English name" value={name} onChange={e => setName(e.target.value)} />
            <input className="input text-sm" placeholder="हिंदी नाम (optional)" value={nameHindi} onChange={e => setNameHindi(e.target.value)} />
          </div>

          {/* ── Default quantity ── */}
          <div className="space-y-2">
            <p className="section-label">
              Default Quantity
              <span className="ml-2 text-ink-500 normal-case font-normal text-xs">
                — auto pre-fills in bill (customer can change freely)
              </span>
            </p>
            <div className="flex gap-1.5 flex-wrap items-center">
              {QUICK_DEFAULTS.map(n => (
                <button
                  key={n}
                  onClick={() => setDefaultQty(n)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all ${
                    dqNum === n
                      ? 'bg-primary-400/20 border-primary-400/40 text-primary-400'
                      : 'bg-ink-700 border-ink-600 text-ink-400 hover:border-ink-500'
                  }`}
                >{n === 1 ? '1 (retail)' : n}</button>
              ))}
              <input
                type="number" min="1" placeholder="Custom"
                value={QUICK_DEFAULTS.includes(dqNum) ? '' : defaultQty}
                onChange={e => setDefaultQty(e.target.value)}
                className="input w-24 text-sm font-mono py-1.5"
              />
            </div>
            <p className="text-xs px-1">
              {dqNum === 1
                ? <span className="text-ink-500">Starts at 1 when added to bill</span>
                : <span className="text-primary-400">Starts at <strong>{dqNum}</strong> when added to bill</span>
              }
            </p>
          </div>

          {/* ── Sizes ── */}
          <div className="space-y-2">
            <p className="section-label">Sizes</p>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm font-mono"
                placeholder="S M L XL  or  28,30,32  or  Free Size"
                value={sizeInput}
                onChange={e => setSizeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSizes()}
              />
              <button onClick={addSizes} className="btn-primary text-sm flex-shrink-0 px-4">Add</button>
            </div>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sizes.map(sz => (
                  <span key={sz} className="inline-flex items-center gap-1 bg-ink-700 border border-ink-600 text-ink-200 px-2.5 py-1 rounded-full text-xs">
                    {sz}
                    <button onClick={() => removeSize(sz)} className="text-ink-500 hover:text-red-400 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Rates ── */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              <p className="section-label">Rates</p>
              <div className="flex gap-2 items-center">
                <input
                  type="number" className="input w-28 text-sm font-mono" placeholder="Base ₹"
                  value={baseRate} onChange={e => setBaseRate(e.target.value)}
                />
                <button onClick={applyToAll}   className="btn-ghost text-xs py-1.5">Apply all</button>
                <button onClick={applyToEmpty} className="btn-ghost text-xs py-1.5">Fill empty</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sizes.map(sz => (
                  <div key={sz} className="flex items-center gap-2 bg-ink-700/50 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-mono text-primary-400 w-12 flex-shrink-0">{sz}</span>
                    <input
                      type="number" className="flex-1 bg-transparent text-sm font-mono text-ink-100 focus:outline-none"
                      placeholder="₹0"
                      value={rates[sz] || ''}
                      onChange={e => setRates(r => ({ ...r, [sz]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error   && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-primary-400 text-sm bg-primary-400/10 border border-primary-400/20 rounded-xl px-3 py-2">{success}</p>}

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-sm">
            {saving ? 'Saving...' : 'Save to Database'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes micbar {
          from { transform: scaleY(0.4); opacity: 0.5; }
          to   { transform: scaleY(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  )
}