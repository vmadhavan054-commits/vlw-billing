import React, { useMemo, useState } from 'react'
import { CalendarCheck, Printer } from 'lucide-react'
import { formatINR } from '../lib/calc.js'
import { StatCard } from '../components/ui.jsx'

export default function DailyClosing({ store }) {
  const { data } = store
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const summary = useMemo(() => {
    const bills = data.bills.filter(b => b.date === date)
    const byMethod = { Cash: 0, UPI: 0, Card: 0, 'Bank Transfer': 0, Credit: 0 }
    bills.forEach(b => { byMethod[b.paymentMethod] = (byMethod[b.paymentMethod] || 0) + (b.paidAmount || 0) })
    const totalSales = bills.reduce((s, b) => s + (b.totals?.grandTotal || 0), 0)
    const expenses = data.expenses.filter(e => e.date === date)
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
    const netAmount = byMethod.Cash - expenses.filter(e => e.paymentMethod === 'Cash').reduce((s, e) => s + Number(e.amount || 0), 0)
    return { bills, byMethod, totalSales, totalExpenses, netAmount, billsCount: bills.length }
  }, [data.bills, data.expenses, date])

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-900">Daily Closing</h1>
        <button onClick={() => window.print()} className="btn-ghost no-print"><Printer size={15} /> Print</button>
      </div>

      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-auto no-print" />

      <div id="print-invoice" className="card p-5">
        <p className="font-display text-lg font-semibold text-ink-900">{data.settings.shopName} — Closing for {date}</p>

        <div className="mt-4 space-y-2 text-sm">
          <Row label="Cash Sales" value={summary.byMethod.Cash} />
          <Row label="UPI Sales" value={summary.byMethod.UPI} />
          <Row label="Card Sales" value={summary.byMethod.Card} />
          <Row label="Bank Transfer Sales" value={summary.byMethod['Bank Transfer']} />
          <Row label="Credit Sales (collected)" value={summary.byMethod.Credit} />
          <div className="border-t border-ink-900/10 pt-2">
            <Row label="Total Sales (grand total)" value={summary.totalSales} bold />
          </div>
          <Row label="Total Expenses" value={-summary.totalExpenses} />
          <div className="border-t-2 border-ink-900 pt-2">
            <Row label="Net Cash in Hand (est.)" value={summary.netAmount} bold accent />
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-600/70">{summary.billsCount} bills recorded on this date. Compare "Net Cash in Hand" with your physical cash drawer to check for mismatches.</p>
      </div>
    </div>
  )
}

function Row({ label, value, bold, accent }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-base' : ''} ${accent ? 'text-brass-600' : 'text-ink-800'}`}>
      <span className={bold ? '' : 'text-ink-600'}>{label}</span>
      <span>{formatINR(value)}</span>
    </div>
  )
}
