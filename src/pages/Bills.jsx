import React, { useMemo, useState } from 'react'
import { FileStack, Filter, Printer, MessageCircle, Eye, Download } from 'lucide-react'
import { formatINR, formatDate } from '../lib/calc.js'
import { Badge, EmptyState } from '../components/ui.jsx'
import { exportBillsToExcel } from '../lib/excelExport.js'

export default function Bills({ store, openBill, searchQuery }) {
  const { data } = store
  const [dateFilter, setDateFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [pendingOnly, setPendingOnly] = useState(false)

  const filtered = useMemo(() => {
    let list = [...data.bills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(b =>
        b.invoiceNo?.toLowerCase().includes(q) ||
        b.customerSnapshot?.name?.toLowerCase().includes(q) ||
        b.customerSnapshot?.mobile?.includes(q) ||
        b.vehicleNumber?.toLowerCase().includes(q)
      )
    }

    const now = new Date()
    if (dateFilter === 'today') list = list.filter(b => new Date(b.date).toDateString() === now.toDateString())
    if (dateFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000)
      list = list.filter(b => new Date(b.date) >= weekAgo)
    }
    if (dateFilter === 'month') list = list.filter(b => new Date(b.date).getMonth() === now.getMonth() && new Date(b.date).getFullYear() === now.getFullYear())

    if (paymentFilter !== 'all') list = list.filter(b => b.paymentMethod === paymentFilter)
    if (pendingOnly) list = list.filter(b => b.balanceAmount > 0)

    return list
  }, [data.bills, searchQuery, dateFilter, paymentFilter, pendingOnly])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-ink-900">Bills</h1>
          <span className="text-sm text-ink-600 hidden sm:inline">{filtered.length} of {data.bills.length}</span>
        </div>
        <button onClick={() => exportBillsToExcel(filtered)} className="btn-outline bg-white"><Download size={16} /> <span className="hidden sm:inline">Excel</span></button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="All" active={dateFilter === 'all'} onClick={() => setDateFilter('all')} />
        <FilterChip label="Today" active={dateFilter === 'today'} onClick={() => setDateFilter('today')} />
        <FilterChip label="This Week" active={dateFilter === 'week'} onClick={() => setDateFilter('week')} />
        <FilterChip label="This Month" active={dateFilter === 'month'} onClick={() => setDateFilter('month')} />
        <span className="mx-1 h-4 w-px bg-ink-900/10" />
        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="input-field w-auto py-1.5 text-xs">
          <option value="all">All Payments</option>
          <option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option><option>Credit</option>
        </select>
        <FilterChip label="Pending Only" active={pendingOnly} onClick={() => setPendingOnly(v => !v)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileStack} title="No bills found" sub="Try changing filters or create a new bill." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-ink-900/10 lg:block">
            <table className="w-full text-sm">
              <thead className="bg-ink-900/[0.03] text-left text-xs font-semibold uppercase text-ink-600">
                <tr>
                  <th className="px-4 py-3">Invoice No</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Vehicle</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/5">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-ink-900/[0.02]">
                    <td className="px-4 py-3 font-semibold text-ink-900">{b.invoiceNo}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(b.date)}</td>
                    <td className="px-4 py-3">{b.customerSnapshot?.name}</td>
                    <td className="px-4 py-3 text-ink-600">{b.vehicleNumber}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatINR(b.totals?.grandTotal)}</td>
                    <td className="px-4 py-3 text-right">{formatINR(b.paidAmount)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{b.balanceAmount > 0 ? formatINR(b.balanceAmount) : '—'}</td>
                    <td className="px-4 py-3">{b.paymentMethod}</td>
                    <td className="px-4 py-3"><Badge tone={b.status === 'Paid' ? 'green' : b.status === 'Partially Paid' ? 'amber' : 'red'}>{b.status}</Badge></td>
                    <td className="px-4 py-3">
                      <button onClick={() => openBill(b.id)} className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-900/5"><Eye size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 lg:hidden">
            {filtered.map(b => (
              <button key={b.id} onClick={() => openBill(b.id)} className="card block w-full p-3.5 text-left">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink-900">{b.invoiceNo}</p>
                  <Badge tone={b.status === 'Paid' ? 'green' : b.status === 'Partially Paid' ? 'amber' : 'red'}>{b.status}</Badge>
                </div>
                <p className="text-xs text-ink-600/70">{b.customerSnapshot?.name} · {b.vehicleNumber}</p>
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="text-ink-600">{formatDate(b.date)} · {b.paymentMethod}</span>
                  <span className="font-bold">{formatINR(b.totals?.grandTotal)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? 'bg-ink-900 text-white' : 'bg-ink-900/5 text-ink-700 hover:bg-ink-900/10'}`}>
      {label}
    </button>
  )
}
