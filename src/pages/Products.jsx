import React, { useState, useMemo } from 'react'
import { Package, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { formatINR, GST_PRESETS } from '../lib/calc.js'
import { Modal, Badge, EmptyState, ConfirmDialog } from '../components/ui.jsx'

const CATEGORIES = ['Seat Cover', 'Floor Mat', 'Steering Cover', 'Accessories', 'Fitting', 'Other']

function blankForm() {
  return { id: null, name: '', category: 'Seat Cover', hsn: '', purchasePrice: '', sellingPrice: '', gstPercent: 18, stock: '', lowStockLimit: 5 }
}

export default function Products({ store, searchQuery }) {
  const { data, upsertProduct, deleteProduct } = store
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(blankForm())
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [error, setError] = useState('')

  const filtered = useMemo(() => {
    if (!searchQuery) return data.products
    const q = searchQuery.toLowerCase()
    return data.products.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
  }, [data.products, searchQuery])

  function openEdit(p) { setForm(p); setShowModal(true) }
  function openNew() { setForm(blankForm()); setShowModal(true) }

  function submit() {
    if (!form.name.trim()) return setError('Product name is required')
    if (Number(form.sellingPrice) <= 0) return setError('Selling price must be greater than 0')
    upsertProduct({
      ...form,
      purchasePrice: Number(form.purchasePrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      gstPercent: Number(form.gstPercent) || 0,
      stock: Number(form.stock) || 0,
      lowStockLimit: Number(form.lowStockLimit) || 5,
    })
    setShowModal(false)
    setError('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-900">Products & Services</h1>
        <button onClick={openNew} className="btn-accent"><Plus size={16} /> Add Product</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" sub="Add your seat covers, mats, and other stock items here." action={<button className="btn-accent" onClick={openNew}>+ Add Product</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => {
            const low = Number(p.stock) <= Number(p.lowStockLimit || 5)
            return (
              <div key={p.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg font-semibold text-ink-900">{p.name}</p>
                    <p className="text-xs text-ink-600/70">{p.category} · HSN {p.hsn || '—'}</p>
                  </div>
                  {low && <Badge tone="red"><AlertTriangle size={11} className="mr-1 inline" />Low</Badge>}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <span className="text-ink-600">Selling: <b className="text-ink-900">{formatINR(p.sellingPrice)}</b></span>
                  <span className="text-ink-600">GST: <b className="text-ink-900">{p.gstPercent}%</b></span>
                  <span className="text-ink-600">Stock: <b className={low ? 'text-red-600' : 'text-ink-900'}>{p.stock}</b></span>
                  <span className="text-ink-600">Cost: <b className="text-ink-900">{formatINR(p.purchasePrice)}</b></span>
                </div>
                <div className="mt-3 flex gap-2 border-t border-ink-900/5 pt-2">
                  <button onClick={() => openEdit(p)} className="btn-ghost flex-1 !py-1.5 text-xs"><Pencil size={13} /> Edit</button>
                  <button onClick={() => setConfirmDelete(p.id)} className="btn-danger flex-1 !py-1.5"><Trash2 size={13} /> Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={form.id ? 'Edit Product' : 'Add Product'} size="sm">
        <div className="space-y-3">
          <div><label className="label-field">Product Name</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label-field">HSN/SAC</label><input className="input-field" value={form.hsn} onChange={e => setForm(f => ({ ...f, hsn: e.target.value }))} /></div>
            <div><label className="label-field">Purchase Price ₹</label><input type="number" className="input-field" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} /></div>
            <div><label className="label-field">Selling Price ₹</label><input type="number" className="input-field" value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))} /></div>
            <div>
              <label className="label-field">GST %</label>
              <select className="input-field" value={form.gstPercent} onChange={e => setForm(f => ({ ...f, gstPercent: e.target.value }))}>
                {GST_PRESETS.map(g => <option key={g} value={g}>{g}%</option>)}
              </select>
            </div>
            <div><label className="label-field">Stock Qty</label><input type="number" className="input-field" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
            <div className="col-span-2"><label className="label-field">Low Stock Alert Limit</label><input type="number" className="input-field" value={form.lowStockLimit} onChange={e => setForm(f => ({ ...f, lowStockLimit: e.target.value }))} /></div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={submit} className="btn-accent w-full">Save Product</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => deleteProduct(confirmDelete)} message="Delete this product? Past bills will keep their record." />
    </div>
  )
}
