import React, { useMemo, useState } from 'react'
import { Users, Plus, Phone, Car, MapPin, Trash2, ArrowLeft, Receipt } from 'lucide-react'
import { formatINR, formatDate } from '../lib/calc.js'
import { Modal, EmptyState, Badge, ConfirmDialog } from '../components/ui.jsx'

export default function Customers({ store, searchQuery, openBill }) {
  const { data, upsertCustomer, deleteCustomer } = store
  const [selectedId, setSelectedId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const enriched = useMemo(() => {
    return data.customers.map(c => {
      const bills = data.bills.filter(b => b.customerId === c.id)
      const totalPurchase = bills.reduce((s, b) => s + (b.totals?.grandTotal || 0), 0)
      const pending = bills.reduce((s, b) => s + (b.balanceAmount || 0), 0)
      const lastVisit = bills.length ? bills.reduce((latest, b) => new Date(b.date) > new Date(latest) ? b.date : latest, bills[0].date) : null
      return { ...c, billsCount: bills.length, totalPurchase, pending, lastVisit, bills }
    })
  }, [data.customers, data.bills])

  const filtered = useMemo(() => {
    if (!searchQuery) return enriched
    const q = searchQuery.toLowerCase()
    return enriched.filter(c => c.name?.toLowerCase().includes(q) || c.mobile?.includes(q) || c.vehicleNumber?.toLowerCase().includes(q))
  }, [enriched, searchQuery])

  const selected = enriched.find(c => c.id === selectedId)

  if (selected) {
    return <CustomerDetail customer={selected} settings={data.settings} onBack={() => setSelectedId(null)} openBill={openBill} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-900">Customers</h1>
        <button onClick={() => setShowAdd(true)} className="btn-accent"><Plus size={16} /> Add Customer</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" sub="Customers are added automatically when you create a bill, or add one manually." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelectedId(c.id)} className="card p-4 text-left transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg font-semibold text-ink-900">{c.name}</p>
                  <p className="flex items-center gap-1 text-xs text-ink-600/70"><Phone size={11} /> {c.mobile}</p>
                </div>
                {c.pending > 0 && <Badge tone="red">Due {formatINR(c.pending)}</Badge>}
              </div>
              {c.vehicleNumber && <p className="mt-2 flex items-center gap-1 text-xs text-ink-600"><Car size={11} /> {c.vehicleNumber} · {c.vehicleModel}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-ink-900/5 pt-2 text-xs">
                <span className="text-ink-600">{c.billsCount} bills</span>
                <span className="font-semibold text-ink-900">{formatINR(c.totalPurchase)} total</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <AddCustomerModal open={showAdd} onClose={() => setShowAdd(false)} onSave={c => { upsertCustomer(c); setShowAdd(false) }} />
    </div>
  )
}

function AddCustomerModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', mobile: '', vehicleNumber: '', vehicleModel: '', address: '' })
  const [error, setError] = useState('')

  function submit() {
    if (!form.name.trim()) return setError('Name is required')
    if (!/^\d{10}$/.test(form.mobile)) return setError('Enter a valid 10-digit mobile number')
    onSave(form)
    setForm({ name: '', mobile: '', vehicleNumber: '', vehicleModel: '', address: '' })
    setError('')
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Customer" size="sm">
      <div className="space-y-3">
        <div><label className="label-field">Name</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div><label className="label-field">Mobile</label><input className="input-field" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} /></div>
        <div><label className="label-field">Vehicle Number</label><input className="input-field" value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))} /></div>
        <div><label className="label-field">Vehicle Model</label><input className="input-field" value={form.vehicleModel} onChange={e => setForm(f => ({ ...f, vehicleModel: e.target.value }))} /></div>
        <div><label className="label-field">Address</label><input className="input-field" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={submit} className="btn-accent w-full">Save Customer</button>
      </div>
    </Modal>
  )
}

function CustomerDetail({ customer, settings, onBack, openBill }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-ink-600 hover:text-ink-900">
        <ArrowLeft size={15} /> Back to Customers
      </button>

      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">{customer.name}</h1>
            <p className="flex items-center gap-1 text-sm text-ink-600"><Phone size={13} /> {customer.mobile}</p>
          </div>
          {customer.pending > 0 && <Badge tone="red">Pending {formatINR(customer.pending)}</Badge>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Info label="Vehicle" value={customer.vehicleNumber || '—'} />
          <Info label="Model" value={customer.vehicleModel || '—'} />
          <Info label="Total Bills" value={customer.billsCount} />
          <Info label="Total Purchase" value={formatINR(customer.totalPurchase)} />
        </div>
        {customer.address && <p className="mt-3 flex items-center gap-1 text-sm text-ink-600"><MapPin size={13} /> {customer.address}</p>}
        {customer.lastVisit && <p className="mt-1 text-xs text-ink-600/70">Last visit: {formatDate(customer.lastVisit)}</p>}
      </div>

      <div className="card p-4">
        <p className="mb-3 font-display text-lg font-semibold text-ink-900">Bill History</p>
        {customer.bills.length === 0 ? (
          <EmptyState icon={Receipt} title="No bills yet" />
        ) : (
          <div className="divide-y divide-ink-900/5">
            {[...customer.bills].sort((a, b) => new Date(b.date) - new Date(a.date)).map(b => (
              <button key={b.id} onClick={() => openBill(b.id)} className="flex w-full items-center justify-between py-2.5 text-left hover:bg-ink-900/[0.02]">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{b.invoiceNo}</p>
                  <p className="text-xs text-ink-600/70">{formatDate(b.date)}</p>
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

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-ink-600/70">{label}</p>
      <p className="font-medium text-ink-900">{value}</p>
    </div>
  )
}
