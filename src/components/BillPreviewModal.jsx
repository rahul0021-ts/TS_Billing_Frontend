import { useState } from 'react'
import { useWhatsApp } from '../hooks/useWhatsApp'
import { formatAsText, formatForWhatsApp } from '../utils/receiptFormatter'
import { downloadBillPDF, previewBillPDF, sharePDFWhatsApp } from '../utils/pdfGenerator'

export default function BillPreviewModal({ bill, settings, onClose, onNew }) {
  const { sendViaLink } = useWhatsApp()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [copied, setCopied] = useState(false)

  const text   = formatAsText(bill, settings)
  const waText = formatForWhatsApp(bill, settings)
  const phone  = bill?.customer?.phone

  // ── Text WhatsApp ──────────────────────────────────────────────────────────
  function handleWhatsAppText() {
    if (phone) sendViaLink(phone, waText)
  }

  // ── Copy text ──────────────────────────────────────────────────────────────
  function handleCopy() {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Download PDF ───────────────────────────────────────────────────────────
  function handleDownloadPDF() {
    downloadBillPDF(bill, settings)
  }

  // ── Preview PDF in new tab ─────────────────────────────────────────────────
  function handlePreviewPDF() {
    previewBillPDF(bill, settings)
  }

  // ── Share PDF via WhatsApp ─────────────────────────────────────────────────
  async function handlePDFWhatsApp() {
    setPdfLoading(true)
    setShareStatus('')
    try {
      const result = await sharePDFWhatsApp(bill, settings, phone)
      if (result.method === 'webshare') {
        setShareStatus('✓ Shared!')
      } else if (result.method === 'download') {
        setShareStatus('PDF downloaded — WhatsApp opening…')
      }
    } catch {
      setShareStatus('Share failed. Try downloading.')
    } finally {
      setPdfLoading(false)
      setTimeout(() => setShareStatus(''), 3000)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-ink-700/50">
          <div>
            <h2 className="font-display font-bold text-ink-100">Bill Generated!</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Bill #{bill.billNo} · ₹{bill.total}
              {phone && <span> · 📱 {phone}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-ink-700 text-ink-400 flex items-center justify-center"
          >✕</button>
        </div>

        {/* Text receipt preview */}
        <div className="px-5 py-4">
          <pre className="text-xs font-mono text-ink-300 bg-ink-900/60 rounded-xl p-4 overflow-x-auto whitespace-pre leading-relaxed max-h-52 overflow-y-auto border border-ink-700/30">
            {text}
          </pre>
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-5 space-y-2">

          {/* PDF WhatsApp — primary action */}
          <button
            onClick={handlePDFWhatsApp}
            disabled={pdfLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-medium text-sm transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: '#25D366' }}
          >
            <span>📄</span>
            {pdfLoading ? 'Preparing PDF…' : 'Send PDF on WhatsApp'}
          </button>

          {shareStatus && (
            <p className="text-center text-xs text-primary-400">{shareStatus}</p>
          )}

          {/* Secondary row — PDF download + preview */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleDownloadPDF} className="btn-ghost text-sm py-2.5">
              ⬇ Download PDF
            </button>
            <button onClick={handlePreviewPDF} className="btn-ghost text-sm py-2.5">
              👁 Preview PDF
            </button>
          </div>

          {/* Bottom row — text WhatsApp + copy + new bill */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleWhatsAppText}
              disabled={!phone}
              className="btn-ghost text-xs py-2.5 disabled:opacity-40"
            >
              💬 Text WA
            </button>
            <button onClick={handleCopy} className="btn-ghost text-xs py-2.5">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <button onClick={onNew} className="btn-primary text-xs py-2.5">
              नया Bill
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
