import React, { useMemo, useState } from 'react'
import { Printer, Download } from 'lucide-react'
import { formatINR, formatDate } from '../lib/calc.js'
import { StatCard } from '../components/ui.jsx'
import { BarChart } from '../components/Charts.jsx'

function inRange(dateStr, from, to) {
  const d = new Date(dateStr)
  return d >= from && d <= to
}

function getRange(filter, customFrom, customTo) {
  const now = new Date()
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999)
  if (filter === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    return [start, endOfToday]
  }
  if (filter === 'yesterday') {
    const y = new Date(now.getTime() - 86400000)
    const start = new Date(y); start.setHours(0, 0, 0, 0)
    const end = new Date(y); end.setHours(23, 59, 59, 999)
    return [start, end]
  }
  if (filter === 'week') return [new Date(now.getTime() - 7 * 86400000), endOfToday]
  if (filter === 'month') return [new Date(now.getFullYear(), now.getMonth(), 1), endOfToday]
  if (filter === 'custom') return [new Date(customFrom), new Date(customTo + 'T23:59:59')]
  return [new Date(0), endOfToday]
}

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function Reports({ store }) {
  const { data } = store
  const [filter, setFilter] = useState('month')
  const [customFrom, setCustomFrom] = useState(new Date().toISOString().slice(0, 10))
  const [customTo, setCustomTo] = useState(new Date().toISOString().slice(0, 10))

  const [from, to] = getRange(filter, customFrom, customTo)

  const bills = useMemo(() => data.bills.filter(b => inRange(b.date, from, to)), [data.bills, from, to])
  const expenses = useMemo(() => data.expenses.filter(e => inRange(e.date, from, to)), [data.expenses, from, to])

  const totals = useMemo(() => {
    const totalSales = bills.reduce((s, b) => s + (b.totals?.grandTotal || 0), 0)
    const totalGST = bills.reduce((s, b) => s + (b.totals?.gstTotal || 0), 0)
    const totalDiscount = bills.reduce((s, b) => s + (b.totals?.totalDiscount || 0), 0)
    const totalCollection = bills.reduce((s, b) => s + (b.paidAmount || 0), 0)
    const pending = bills.reduce((s, b) => s + (b.balanceAmount || 0), 0)
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
    const profit = totalSales - totalExpenses
    return { totalSales, totalGST, totalDiscount, totalCollection, pending, totalExpenses, profit }
  }, [bills, expenses])

  const byDay = useMemo(() => {
    const map = {}
    bills.forEach(b => {
      const key = new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      map[key] = (map[key] || 0) + (b.totals?.grandTotal || 0)
    })
    return Object.entries(map).map(([label, value]) => ({ label, value: Math.round(value) })).slice(-14)
  }, [bills])

  function exportCSV() {
    const rows = [['Invoice No', 'Date', 'Customer', 'Vehicle', 'Amount', 'Paid', 'Balance', 'Payment Mode', 'Status']]
    bills.forEach(b => rows.push([b.invoiceNo, formatDate(b.date), b.customerSnapshot?.name, b.vehicleNumber, b.totals?.grandTotal, b.paidAmount, b.balanceAmount, b.paymentMethod, b.status]))
    downloadCSV(`Sales_Report_${filter}.csv`, rows)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-ink-900">Reports</h1>
        <div className="flex gap-2 no-print">
          <button onClick={() => window.print()} className="btn-ghost"><Printer size={15} /> Print</button>
          <button onClick={exportCSV} className="btn-accent"><Download size={15} /> Download CSV</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 no-print">
        {['today', 'yesterday', 'week', 'month', 'custom'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? 'bg-ink-900 text-white' : 'bg-ink-900/5 text-ink-700 hover:bg-ink-900/10'}`}>
            {f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : f}
          </button>
        ))}
        {filter === 'custom' && (
          <>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="input-field w-auto py-1.5 text-xs" />
            <span className="text-xs text-ink-600">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="input-field w-auto py-1.5 text-xs" />
          </>
        )}
      </div>

      <div id="print-invoice">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Sales" value={formatINR(totals.totalSales)} accent />
          <StatCard label="Total GST" value={formatINR(totals.totalGST)} />
          <StatCard label="Total Discount" value={formatINR(totals.totalDiscount)} />
          <StatCard label="Total Collection" value={formatINR(totals.totalCollection)} />
          <StatCard label="Pending Amount" value={formatINR(totals.pending)} />
          <StatCard label="Total Expenses" value={formatINR(totals.totalExpenses)} />
          <StatCard label="Estimated Profit" value={formatINR(totals.profit)} />
          <StatCard label="Total Bills" value={bills.length} />
        </div>

        <div className="card mt-4 p-4">
          <p className="mb-3 font-display text-lg font-semibold text-ink-900">Sales Trend</p>
          <BarChart data={byDay} />
        </div>
      </div>
    </div>
  )
}
