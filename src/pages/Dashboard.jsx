import React, { useMemo } from 'react'
import { IndianRupee, Receipt, Clock, Users, AlertTriangle } from 'lucide-react'
import { StatCard, Badge, EmptyState } from '../components/ui.jsx'
import { BarChart, SegmentBars } from '../components/Charts.jsx'
import { formatINR, formatDate } from '../lib/calc.js'
import { FileStack } from 'lucide-react'

function isSameDay(d1, d2) {
  return new Date(d1).toDateString() === new Date(d2).toDateString()
}
function isSameMonth(d1, d2) {
  const a = new Date(d1), b = new Date(d2)
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export default function Dashboard({ store, setPage, openBill }) {
  const { data } = store
  const today = new Date()

  const stats = useMemo(() => {
    const todaysBills = data.bills.filter(b => isSameDay(b.date, today))
    const monthBills = data.bills.filter(b => isSameMonth(b.date, today))
    const todaySales = todaysBills.reduce((s, b) => s + (b.totals?.grandTotal || 0), 0)
    const monthSales = monthBills.reduce((s, b) => s + (b.totals?.grandTotal || 0), 0)
    const monthExpenses = data.expenses.filter(e => isSameMonth(e.date, today)).reduce((s, e) => s + Number(e.amount || 0), 0)
    const monthProfit = monthSales - monthExpenses
    const pending = data.bills.reduce((s, b) => s + (b.balanceAmount || 0), 0)
    const lowStock = data.products.filter(p => Number(p.stock) <= Number(p.lowStockLimit || 5))
    return { todaySales, todaysBillsCount: todaysBills.length, monthSales, monthProfit, pending, lowStock }
  }, [data])

  const last7Days = useMemo(() => {
    const arr = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const value = data.bills.filter(b => isSameDay(b.date, d)).reduce((s, b) => s + (b.totals?.grandTotal || 0), 0)
      arr.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), value: Math.round(value) })
    }
    return arr
  }, [data.bills])

  const topItems = useMemo(() => {
    const map = {}
    data.bills.forEach(b => (b.items || []).forEach(it => {
      map[it.name] = (map[it.name] || 0) + (Number(it.qty) || 0) * (Number(it.rate) || 0)
    }))
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value: Math.round(value) }))
  }, [data.bills])

  const paymentSummary = useMemo(() => {
    const map = {}
    data.bills.forEach(b => { map[b.paymentMethod] = (map[b.paymentMethod] || 0) + (b.totals?.grandTotal || 0) })
    return Object.entries(map).map(([label, value]) => ({ label, value: Math.round(value) }))
  }, [data.bills])

  const recentBills = [...data.bills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-600">{getGreeting()}</p>
        <h1 className="font-display text-3xl font-bold text-ink-900">{data.settings.shopName}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Today's Sales" value={formatINR(stats.todaySales)} icon={IndianRupee} accent />
        <StatCard label="Bills Today" value={stats.todaysBillsCount} icon={Receipt} />
        <StatCard label="Pending Amount" value={formatINR(stats.pending)} icon={Clock} />
        <StatCard label="Customers" value={data.customers.length} icon={Users} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="This Month Sales" value={formatINR(stats.monthSales)} />
        <StatCard label="This Month Profit (est.)" value={formatINR(stats.monthProfit)} />
        <StatCard label="Total Bills" value={data.bills.length} />
        <StatCard label="Low Stock Items" value={stats.lowStock.length} icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <p className="mb-3 font-display text-lg font-semibold text-ink-900">Sales — Last 7 Days</p>
          <BarChart data={last7Days} />
        </div>
        <div className="card p-4">
          <p className="mb-3 font-display text-lg font-semibold text-ink-900">Payment Method Split</p>
          {paymentSummary.length ? <SegmentBars data={paymentSummary} /> : <EmptyState title="No bills yet" sub="Create your first invoice to see the split." />}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <p className="mb-3 font-display text-lg font-semibold text-ink-900">Top Selling Items</p>
          {topItems.length ? <BarChart data={topItems} color="#4a5567" /> : <EmptyState title="No sales yet" />}
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-lg font-semibold text-ink-900">Low Stock Alerts</p>
            <button onClick={() => setPage('products')} className="text-xs font-semibold text-brass-600">View all</button>
          </div>
          {stats.lowStock.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="All stocked up" sub="No products are below their low-stock limit." />
          ) : (
            <div className="space-y-2">
              {stats.lowStock.slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm">
                  <span className="font-medium text-ink-900">{p.name}</span>
                  <Badge tone="red">{p.stock} left</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-ink-900">Recent Bills</p>
          <button onClick={() => setPage('bills')} className="text-xs font-semibold text-brass-600">View all</button>
        </div>
        {recentBills.length === 0 ? (
          <EmptyState icon={FileStack} title="No bills yet" sub="Tap New Bill to create your first invoice." action={<button className="btn-accent" onClick={() => setPage('new-bill')}>+ New Bill</button>} />
        ) : (
          <div className="divide-y divide-ink-900/5">
            {recentBills.map(b => (
              <button key={b.id} onClick={() => openBill(b.id)} className="flex w-full items-center justify-between py-2.5 text-left hover:bg-ink-900/[0.02]">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{b.invoiceNo} · {b.customerSnapshot?.name}</p>
                  <p className="text-xs text-ink-600/70">{formatDate(b.date)} · {b.vehicleNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatINR(b.totals?.grandTotal)}</p>
                  <Badge tone={b.status === 'Paid' ? 'green' : b.status === 'Partially Paid' ? 'amber' : 'red'}>{b.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning!'
  if (h < 17) return 'Good Afternoon!'
  return 'Good Evening!'
}
