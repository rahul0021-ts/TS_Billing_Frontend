import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as billsApi from '../api/bills'
import { useSettings } from '../hooks/useSettings'
import { useWhatsApp } from '../hooks/useWhatsApp'
import { formatForWhatsApp } from '../utils/receiptFormatter'
import { downloadBillPDF, sharePDFWhatsApp } from '../utils/pdfGenerator'

function StatCard({ label, value, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-400/10 border-primary-400/20 text-primary-400',
    amber:   'bg-amber-400/10 border-amber-400/20 text-amber-400',
    blue:    'bg-blue-400/10 border-blue-400/20 text-blue-400',
    purple:  'bg-purple-400/10 border-purple-400/20 text-purple-400',
  }
  return (
    <div className={`rounded-2xl border px-4 py-3 ${colors[color]}`}>
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-xs opacity-70 mt-0.5">{label}</div>
    </div>
  )
}

function BillRow({ bill, settings, onWhatsApp }) {
  const [expanded, setExpanded]   = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const date = new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  async function handlePDFWhatsApp() {
    setPdfLoading(true)
    try {
      await sharePDFWhatsApp(bill, settings, bill.customer?.phone)
    } catch {
      downloadBillPDF(bill, settings)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ink-700/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-primary-400 font-bold text-sm">#{bill.billNo}</span>
          <div>
            <div className="text-sm font-medium text-ink-100">
              {bill.customer?.name || 'Walk-in Customer'}
            </div>
            <div className="text-xs text-ink-500">
              {date} · {time}
              {bill.customer?.phone && <span className="ml-2 text-ink-600">📱 {bill.customer.phone}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {bill.whatsappSent && (
            <span className="text-xs bg-green-900/40 text-green-400 border border-green-800/40 px-2 py-0.5 rounded-full">📲 Sent</span>
          )}
          <span className="font-mono font-bold text-ink-100">₹{bill.total}</span>
          <span className="text-ink-500 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-ink-700/40 px-4 py-3 space-y-3 animate-slide-in">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-ink-500 border-b border-ink-700/50">
                  <th className="pb-1 text-left">#</th>
                  <th className="pb-1 text-left">Item</th>
                  <th className="pb-1 text-center">Size</th>
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Rate</th>
                  <th className="pb-1 text-right">Amt</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-ink-700/20' : ''}>
                    <td className="py-1 font-mono text-ink-500">{i + 1}</td>
                    <td className="py-1 text-ink-200 max-w-[120px] truncate">{item.name}</td>
                    <td className="py-1 text-center font-mono text-primary-400">{item.size}</td>
                    <td className="py-1 text-center font-mono">{item.qty}</td>
                    <td className="py-1 text-right font-mono text-ink-400">₹{item.rate}</td>
                    <td className="py-1 text-right font-mono font-medium">₹{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-ink-700/30">
            <div className="text-xs text-ink-500 space-y-0.5">
              <div>Payment: <span className="text-ink-300">{bill.paymentMethod}</span></div>
              {bill.customer?.phone && <div>📱 {bill.customer.phone}</div>}
            </div>
            <div className="text-right space-y-0.5">
              {bill.discount > 0 && (
                <div className="text-xs text-ink-500">Subtotal: ₹{bill.subtotal} · -₹{bill.discount}</div>
              )}
              <div className="font-bold font-mono text-primary-400">₹{bill.total}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePDFWhatsApp}
              disabled={pdfLoading}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-medium transition-all active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: '#25D366' }}
            >
              📄 {pdfLoading ? 'Preparing…' : 'Send PDF'}
            </button>
            <button
              onClick={() => onWhatsApp(bill)}
              disabled={!bill.customer?.phone}
              className="btn-ghost text-xs py-2 disabled:opacity-40"
            >
              💬 Resend Text
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const [search, setSearch]   = useState('')
  const [from, setFrom]       = useState('')
  const [to, setTo]           = useState('')
  const [page, setPage]       = useState(1)

  const { settings }    = useSettings()
  const { sendViaLink } = useWhatsApp()

  const { data: stats } = useQuery({
    queryKey: ['bills', 'stats'],
    queryFn:  billsApi.getStats,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['bills', { from, to, page }],
    queryFn:  () => billsApi.getAll({ from: from || undefined, to: to || undefined, page, limit: 50 }),
  })

  const allBills   = data?.data        || []
  const totalPages = data?.totalPages  || 1

  // ── Client-side search filter ──────────────────────────────────────────────
  // Searches by customer name, phone, or bill number
  const bills = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allBills
    return allBills.filter(bill =>
      bill.billNo?.toLowerCase().includes(q) ||
      bill.customer?.name?.toLowerCase().includes(q) ||
      bill.customer?.phone?.includes(q)
    )
  }, [allBills, search])

  function handleWhatsApp(bill) {
    const text = formatForWhatsApp(bill, settings)
    sendViaLink(bill.customer.phone, text)
  }

  function clearSearch() {
    setSearch('')
  }

  function clearFilters() {
    setFrom('')
    setTo('')
    setPage(1)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Bills"  value={stats?.totalBills   ?? '—'} color="primary" />
        <StatCard label="Today"        value={stats?.todayBills   ?? '—'} color="blue"    />
        <StatCard label="This Month"   value={stats?.monthBills   ?? '—'} color="amber"   />
        <StatCard label="Revenue"      value={stats?.totalRevenue ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '—'} color="purple" />
      </div>

      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 text-sm pointer-events-none">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer name, phone, or bill no…"
          className="input pl-9 text-sm"
          style={{ paddingRight: search ? '2.5rem' : undefined }}
        />
        {search && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors"
          >✕</button>
        )}
      </div>

      {/* Search result count */}
      {search && (
        <p className="text-xs text-ink-500 -mt-2 px-1">
          {bills.length === 0
            ? 'No bills match your search'
            : `${bills.length} bill${bills.length !== 1 ? 's' : ''} found for "${search}"`}
        </p>
      )}

      {/* Date filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="section-label">Date:</span>
        <input
          type="date"
          value={from}
          onChange={e => { setFrom(e.target.value); setPage(1) }}
          className="input w-36 text-sm"
        />
        <span className="text-ink-500 text-sm">to</span>
        <input
          type="date"
          value={to}
          onChange={e => { setTo(e.target.value); setPage(1) }}
          className="input w-36 text-sm"
        />
        {(from || to) && (
          <button onClick={clearFilters} className="btn-ghost text-sm py-1.5">Clear</button>
        )}
      </div>

      {/* Bill list */}
      {isLoading ? (
        <div className="text-center py-16 text-ink-500 text-sm">Loading…</div>
      ) : bills.length === 0 ? (
        <div className="text-center py-16 text-ink-500 text-sm">
          {search ? `No bills found for "${search}"` : 'No bills found'}
        </div>
      ) : (
        <div className="space-y-2">
          {bills.map(bill => (
            <BillRow
              key={bill._id}
              bill={bill}
              settings={settings}
              onWhatsApp={handleWhatsApp}
            />
          ))}
        </div>
      )}

      {/* Pagination — hidden when searching */}
      {!search && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-sm py-1.5 px-4">← Prev</button>
          <span className="text-ink-400 text-sm">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost text-sm py-1.5 px-4">Next →</button>
        </div>
      )}

    </div>
  )
}