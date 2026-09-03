import React, { useState } from 'react'
import { Truck, Plus, Trash2, Download } from 'lucide-react'
import { formatINR, formatDate } from '../lib/calc.js'
import { Modal, EmptyState, ConfirmDialog } from '../components/ui.jsx'
import { exportPurchasesToExcel } from '../lib/excelExport.js'

function blankForm() {
  return { supplier: '', invoiceNo: '', date: new Date().toISOString().slice(0, 10), productId: '', qty: '', rate: '', gstPercent: 18 }
}

export default function Purchases({ store }) {
  const { data, addPurchase, deletePurchase } = store
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(blankForm())
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  function submit() {
    if (!form.supplier.trim()) return setError('Supplier name is required')
    if (!form.productId) return setError('Select a product')
    if (Number(form.qty) <= 0) return setError('Quantity must be greater than 0')

    const product = data.products.find(p => p.id === form.productId)
    const qty = Number(form.qty)
    const rate = Number(form.rate) || 0
    const gstAmount = (qty * rate) * (Number(form.gstPercent) / 100)
    const total = qty * rate + gstAmount

    addPurchase({ ...form, productName: product?.name, qty, rate, gstPercent: Number(form.gstPercent), total })
    setShowModal(false)
    setForm(blankForm())
    setError('')
  }

  const sorted = [...data.purchases].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-900">Purchases</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => exportPurchasesToExcel(sorted)} className="btn-outline bg-white"><Download size={16} /> <span className="hidden sm:inline">Excel</span></button>
          <button onClick={() => { setForm(blankForm()); setShowModal(true) }} className="btn-accent"><Plus size={16} /> Add Purchase</button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={Truck} title="No purchases recorded" sub="Record stock purchases here — stock updates automatically." />
      ) : (
        <div className="card divide-y divide-ink-900/5 p-1">
          {sorted.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-semibold text-ink-900">{p.productName} × {p.qty}</p>
                <p className="text-xs text-ink-600/70">{p.supplier} · {formatDate(p.date)} {p.invoiceNo && `· Inv ${p.invoiceNo}`}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{formatINR(p.total)}</span>
                <button onClick={() => setConfirmDelete(p.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Purchase" size="sm">
        <div className="space-y-3">
          <div><label className="label-field">Supplier</label><input className="input-field" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-field">Invoice No</label><input className="input-field" value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))} /></div>
            <div><label className="label-field">Date</label><input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div>
            <label className="label-field">Product</label>
            <select className="input-field" value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}>
              <option value="">Select product</option>
              {data.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label-field">Qty</label><input type="number" className="input-field" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></div>
            <div><label className="label-field">Rate ₹</label><input type="number" className="input-field" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} /></div>
            <div><label className="label-field">GST %</label><input type="number" className="input-field" value={form.gstPercent} onChange={e => setForm(f => ({ ...f, gstPercent: e.target.value }))} /></div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={submit} className="btn-accent w-full">Save Purchase</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => deletePurchase(confirmDelete)} message="Delete this purchase record? Stock will not be auto-reverted." />
    </div>
  )
}
