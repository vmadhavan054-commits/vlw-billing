import React, { useState, useMemo } from 'react'
import { Wallet, Plus, Trash2 } from 'lucide-react'
import { formatINR, formatDate } from '../lib/calc.js'
import { Modal, EmptyState, StatCard, ConfirmDialog } from '../components/ui.jsx'

const CATEGORIES = ['Rent', 'Electricity', 'Salary', 'Transport', 'Material', 'Maintenance', 'Other']
const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer']

function blankForm() {
  return { date: new Date().toISOString().slice(0, 10), category: 'Material', description: '', amount: '', paymentMethod: 'Cash' }
}

export default function Expenses({ store }) {
  const { data, addExpense, deleteExpense } = store
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(blankForm())
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const stats = useMemo(() => {
    const now = new Date()
    const today = data.expenses.filter(e => new Date(e.date).toDateString() === now.toDateString()).reduce((s, e) => s + Number(e.amount || 0), 0)
    const month = data.expenses.filter(e => new Date(e.date).getMonth() === now.getMonth() && new Date(e.date).getFullYear() === now.getFullYear()).reduce((s, e) => s + Number(e.amount || 0), 0)
    const total = data.expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
    return { today, month, total }
  }, [data.expenses])

  function submit() {
    if (Number(form.amount) <= 0) return setError('Amount must be greater than 0')
    if (!form.description.trim()) return setError('Description is required')
    addExpense({ ...form, amount: Number(form.amount) })
    setShowModal(false)
    setForm(blankForm())
    setError('')
  }

  const sorted = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-900">Expenses</h1>
        <button onClick={() => { setForm(blankForm()); setShowModal(true) }} className="btn-accent"><Plus size={16} /> Add Expense</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Today" value={formatINR(stats.today)} />
        <StatCard label="This Month" value={formatINR(stats.month)} />
        <StatCard label="Total" value={formatINR(stats.total)} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={Wallet} title="No expenses recorded" />
      ) : (
        <div className="card divide-y divide-ink-900/5 p-1">
          {sorted.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-semibold text-ink-900">{e.description}</p>
                <p className="text-xs text-ink-600/70">{e.category} · {formatDate(e.date)} · {e.paymentMethod}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-600">- {formatINR(e.amount)}</span>
                <button onClick={() => setConfirmDelete(e.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Expense" size="sm">
        <div className="space-y-3">
          <div><label className="label-field">Date</label><input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div>
            <label className="label-field">Category</label>
            <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label-field">Description</label><input className="input-field" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-field">Amount ₹</label><input type="number" className="input-field" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div>
              <label className="label-field">Payment Method</label>
              <select className="input-field" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={submit} className="btn-accent w-full">Save Expense</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => deleteExpense(confirmDelete)} message="Delete this expense record?" />
    </div>
  )
}
