import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as billsApi from '../api/bills'
import { useSettings } from '../hooks/useSettings'
import { useWhatsApp } from '../hooks/useWhatsApp'
import { formatForWhatsApp } from '../utils/receiptFormatter'

function StatCard({ label, value, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-400/10 border-primary-400/20 text-primary-400',
    amber: 'bg-amber-400/10 border-amber-400/20 text-amber-400',
    blue: 'bg-blue-400/10 border-blue-400/20 text-blue-400',
    purple: 'bg-purple-400/10 border-purple-400/20 text-purple-400',
  }
  return (
    <div className={`rounded-2xl border px-4 py-3 ${colors[color]}`}>
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-xs opacity-70 mt-0.5">{label}</div>
    </div>
  )
}

function BillRow({ bill, settings, onWhatsApp }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

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
            <div className="text-xs text-ink-500">{date} · {time}</div>
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
              <div>Payment: <span className="text-ink-300 capitalize">{bill.paymentMethod}</span></div>
              {bill.customer?.phone && <div>📱 {bill.customer.phone}</div>}
            </div>
            <div className="text-right space-y-0.5">
              {bill.discount > 0 && <div className="text-xs text-ink-500">Subtotal: ₹{bill.subtotal} · -₹{bill.discount}</div>}
              <div className="font-bold font-mono text-primary-400">₹{bill.total}</div>
            </div>
          </div>
          {bill.customer?.phone && (
            <button
              onClick={() => onWhatsApp(bill)}
              className="btn-wa w-full text-sm py-2"
            >
              📲 Resend WhatsApp
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const { settings } = useSettings()
  const { sendViaLink } = useWhatsApp()

  const { data: stats } = useQuery({
    queryKey: ['bills', 'stats'],
    queryFn: billsApi.getStats,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['bills', { from, to, page }],
    queryFn: () => billsApi.getAll({ from: from || undefined, to: to || undefined, page, limit: 20 }),
  })

  const bills = data?.data || []
  const totalPages = data?.totalPages || 1

  function handleWhatsApp(bill) {
    const text = formatForWhatsApp(bill, settings)
    sendViaLink(bill.customer.phone, text)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Bills" value={stats?.totalBills ?? '—'} color="primary" />
        <StatCard label="Today" value={stats?.todayBills ?? '—'} color="blue" />
        <StatCard label="This Month" value={stats?.monthBills ?? '—'} color="amber" />
        <StatCard label="Revenue" value={stats?.totalRevenue ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '—'} color="purple" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="section-label">Filter:</span>
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} className="input w-36 text-sm" />
        <span className="text-ink-500 text-sm">to</span>
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} className="input w-36 text-sm" />
        {(from || to) && (
          <button onClick={() => { setFrom(''); setTo(''); setPage(1) }} className="btn-ghost text-sm py-1.5">Clear</button>
        )}
      </div>

      {/* Bill list */}
      {isLoading ? (
        <div className="text-center py-16 text-ink-500 text-sm">Loading…</div>
      ) : bills.length === 0 ? (
        <div className="text-center py-16 text-ink-500 text-sm">No bills found</div>
      ) : (
        <div className="space-y-2">
          {bills.map(bill => (
            <BillRow key={bill._id} bill={bill} settings={settings} onWhatsApp={handleWhatsApp} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-sm py-1.5 px-4">← Prev</button>
          <span className="text-ink-400 text-sm">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost text-sm py-1.5 px-4">Next →</button>
        </div>
      )}
    </div>
  )
}