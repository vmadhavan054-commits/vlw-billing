import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Trash2, Search, Printer, MessageCircle, Save } from 'lucide-react'
import { calcInvoice, calcLineItem, formatINR, GST_PRESETS } from '../lib/calc.js'
import { uid } from '../lib/store.js'
import { Modal } from '../components/ui.jsx'

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit']
const ITEM_PRESETS = ['Seat Cover', 'Floor Mat', 'Steering Cover', 'Door Pad', 'Roof Lining', 'Car Carpet', 'Leather Work', 'Fitting Labour', 'Car Accessories', 'Other Work']

function blankItem() {
  return { id: uid('li'), name: '', hsn: '', qty: 1, rate: '', discountType: 'amount', discountValue: 0, gstPercent: 18, productId: null }
}

export default function NewBill({ store, editBillId, onSaved, goToBills }) {
  const { data, findCustomerByMobile, upsertCustomer, saveBill, nextInvoiceNumber, saveDraft, clearDraft, adjustStock } = store

  const editing = editBillId ? data.bills.find(b => b.id === editBillId) : null
  const draft = !editing ? data.draftBill : null

  const [mobile, setMobile] = useState(editing?.customerSnapshot?.mobile || draft?.mobile || '')
  const [customerId, setCustomerId] = useState(editing?.customerId || draft?.customerId || null)
  const [customerName, setCustomerName] = useState(editing?.customerSnapshot?.name || draft?.customerName || '')
  const [vehicleNumber, setVehicleNumber] = useState(editing?.vehicleNumber || draft?.vehicleNumber || '')
  const [vehicleModel, setVehicleModel] = useState(editing?.vehicleModel || draft?.vehicleModel || '')
  const [address, setAddress] = useState(draft?.address || '')
  const [date, setDate] = useState(editing?.date || draft?.date || new Date().toISOString().slice(0, 10))
  const [gstType, setGstType] = useState(editing?.gstType || draft?.gstType || 'SPLIT')
  const [items, setItems] = useState(editing?.items || draft?.items || [blankItem()])
  const [paymentMethod, setPaymentMethod] = useState(editing?.paymentMethod || draft?.paymentMethod || 'Cash')
  const [paidAmount, setPaidAmount] = useState(editing?.paidAmount ?? draft?.paidAmount ?? '')
  const [notes, setNotes] = useState(editing?.notes || '')
  const [matchInfo, setMatchInfo] = useState('')
  const [errors, setErrors] = useState({})
  const [savedBill, setSavedBill] = useState(null)
  const [showResume, setShowResume] = useState(!editing && !!data.draftBill)

  const invoiceNo = editing?.invoiceNo || nextInvoiceNumber()

  // ---------- auto customer lookup ----------
  useEffect(() => {
    if (mobile.length === 10) {
      const found = findCustomerByMobile(mobile)
      if (found) {
        setCustomerId(found.id)
        setCustomerName(found.name)
        setVehicleNumber(found.vehicleNumber || '')
        setVehicleModel(found.vehicleModel || '')
        setAddress(found.address || '')
        setMatchInfo(`Existing customer found — ${found.name}`)
      } else {
        setCustomerId(null)
        setMatchInfo('New customer — details will be saved')
      }
    } else {
      setMatchInfo('')
    }
  }, [mobile])

  // ---------- autosave draft (debounced) ----------
  const draftTimer = useRef(null)
  useEffect(() => {
    if (editing) return // don't draft while editing an existing bill
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      const hasContent = mobile || customerName || items.some(i => i.name || i.rate)
      if (hasContent) {
        saveDraft({ mobile, customerId, customerName, vehicleNumber, vehicleModel, address, date, gstType, items, paymentMethod, paidAmount })
      }
    }, 800)
    return () => clearTimeout(draftTimer.current)
  }, [mobile, customerId, customerName, vehicleNumber, vehicleModel, address, date, gstType, items, paymentMethod, paidAmount])

  const totals = useMemo(() => calcInvoice(items.filter(i => i.name && Number(i.rate) > 0), gstType), [items, gstType])

  function updateItem(id, patch) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))
  }
  function addItem() {
    setItems(prev => [...prev, blankItem()])
  }
  function removeItem(id) {
    setItems(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev)
  }

  function validate() {
    const e = {}
    if (!customerName.trim()) e.customerName = 'Customer name is required'
    if (!/^\d{10}$/.test(mobile)) e.mobile = 'Enter a valid 10-digit mobile number'
    const validItems = items.filter(i => i.name && Number(i.rate) > 0)
    if (validItems.length === 0) e.items = 'Add at least one item with a rate'
    items.forEach(i => {
      if (Number(i.qty) < 0) e.items = 'Quantity cannot be negative'
      if (Number(i.rate) < 0) e.items = 'Rate cannot be negative'
    })
    if (paymentMethod === 'Credit') {
      const paid = Number(paidAmount) || 0
      if (paid < 0) e.paidAmount = 'Paid amount cannot be negative'
      if (paid > totals.grandTotal) e.paidAmount = 'Paid amount cannot exceed the total'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave(action) {
    if (!validate()) return

    const cust = upsertCustomer({
      id: customerId,
      name: customerName.trim(),
      mobile,
      vehicleNumber,
      vehicleModel,
      address,
    })

    const cleanItems = items.filter(i => i.name && Number(i.rate) > 0).map(i => ({ ...i, qty: Number(i.qty) || 1, rate: Number(i.rate) || 0 }))

    const billPayload = {
      id: editing?.id,
      invoiceNo,
      date,
      customerId: cust.id,
      customerSnapshot: { name: cust.name, mobile: cust.mobile },
      vehicleNumber,
      vehicleModel,
      items: cleanItems,
      gstType,
      paymentMethod,
      paidAmount: paymentMethod === 'Credit' ? Number(paidAmount) || 0 : totals.grandTotal,
      notes,
      createdAt: editing?.createdAt,
    }

    const saved = saveBill(billPayload)
    clearDraft()
    setSavedBill(saved)

    if (action === 'print') {
      setTimeout(() => onSaved(saved.id, 'print'), 100)
    } else if (action === 'whatsapp') {
      setTimeout(() => onSaved(saved.id, 'whatsapp'), 100)
    } else {
      onSaved(saved.id, 'view')
    }
  }

  function resumeDraft() { setShowResume(false) }
  function discardDraft() {
    clearDraft()
    setShowResume(false)
    setMobile(''); setCustomerName(''); setVehicleNumber(''); setVehicleModel('')
    setItems([blankItem()])
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Modal open={showResume} onClose={() => setShowResume(false)} title="Resume Draft?" size="sm">
        <p className="text-sm text-ink-700">You have an unsaved bill draft for <b>{data.draftBill?.customerName || 'a customer'}</b>. Resume it or start fresh?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={discardDraft}>Start Fresh</button>
          <button className="btn-accent" onClick={resumeDraft}>Resume</button>
        </div>
      </Modal>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">{editing ? 'Edit Bill' : 'New Bill'}</h1>
          <p className="text-sm text-ink-600">Invoice No: <span className="font-semibold text-ink-900">{invoiceNo}</span></p>
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-auto" />
      </div>

      {/* Customer block */}
      <div className="card p-4">
        <p className="mb-3 font-display text-lg font-semibold text-ink-900">Customer & Vehicle</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label-field">Mobile Number</label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/40" />
              <input
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile"
                inputMode="numeric"
                className="input-field pl-8"
              />
            </div>
            {matchInfo && <p className="mt-1 text-xs text-brass-600">{matchInfo}</p>}
            {errors.mobile && <p className="mt-1 text-xs text-red-600">{errors.mobile}</p>}
          </div>
          <div>
            <label className="label-field">Customer Name</label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name" className="input-field" />
            {errors.customerName && <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>}
          </div>
          <div>
            <label className="label-field">Vehicle Number</label>
            <input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())} placeholder="TN 09 AB 1234" className="input-field" />
          </div>
          <div>
            <label className="label-field">Vehicle Model</label>
            <input value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} placeholder="Hyundai i20" className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">Address (optional)</label>
            <input value={address} onChange={e => setAddress(e.target.value)} className="input-field" />
          </div>
        </div>
      </div>

      {/* Items block */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-ink-900">Items / Work</p>
          <div className="flex items-center gap-1 rounded-lg bg-ink-900/5 p-1 text-xs font-semibold">
            {['SPLIT', 'IGST', 'NONE'].map(t => (
              <button key={t} onClick={() => setGstType(t)}
                className={`rounded-md px-2.5 py-1 ${gstType === t ? 'bg-white shadow text-ink-900' : 'text-ink-600'}`}>
                {t === 'SPLIT' ? 'CGST+SGST' : t === 'IGST' ? 'IGST' : 'No GST'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const line = calcLineItem(item)
            return (
              <div key={item.id} className="rounded-xl border border-ink-900/10 p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                  <div className="col-span-2 sm:col-span-2">
                    <label className="label-field">Item / Work</label>
                    <input
                      list="item-presets"
                      value={item.name}
                      onChange={e => updateItem(item.id, { name: e.target.value })}
                      placeholder="e.g. Seat Cover"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-field">HSN/SAC</label>
                    <input value={item.hsn} onChange={e => updateItem(item.id, { hsn: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Qty</label>
                    <input type="number" min="0" value={item.qty} onChange={e => updateItem(item.id, { qty: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Rate ₹</label>
                    <input type="number" min="0" value={item.rate} onChange={e => updateItem(item.id, { rate: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">GST %</label>
                    <select value={item.gstPercent} onChange={e => updateItem(item.id, { gstPercent: Number(e.target.value) })} className="input-field">
                      {GST_PRESETS.map(g => <option key={g} value={g}>{g}%</option>)}
                      {!GST_PRESETS.includes(Number(item.gstPercent)) && <option value={item.gstPercent}>{item.gstPercent}% (custom)</option>}
                    </select>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
                  <div className="col-span-2 sm:col-span-2 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="label-field">Discount</label>
                      <input type="number" min="0" value={item.discountValue} onChange={e => updateItem(item.id, { discountValue: e.target.value })} className="input-field" />
                    </div>
                    <select value={item.discountType} onChange={e => updateItem(item.id, { discountType: e.target.value })} className="input-field w-16">
                      <option value="amount">₹</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-3 flex items-end justify-end gap-4 text-sm">
                    <span className="text-ink-600">Taxable: <b className="text-ink-900">{formatINR(line.taxable)}</b></span>
                    <span className="text-ink-600">GST: <b className="text-ink-900">{formatINR(line.gstAmount)}</b></span>
                    <span className="text-ink-900">Total: <b className="text-brass-600">{formatINR(line.total)}</b></span>
                  </div>
                  <div className="flex items-end justify-end">
                    <button onClick={() => removeItem(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {errors.items && <p className="mt-2 text-xs text-red-600">{errors.items}</p>}

        <datalist id="item-presets">
          {ITEM_PRESETS.map(p => <option key={p} value={p} />)}
        </datalist>

        <button onClick={addItem} className="btn-ghost mt-3">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Payment block */}
      <div className="card p-4">
        <p className="mb-3 font-display text-lg font-semibold text-ink-900">Payment</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label-field">Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input-field">
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {paymentMethod === 'Credit' && (
            <div>
              <label className="label-field">Paid Amount ₹</label>
              <input type="number" min="0" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="input-field" />
              {errors.paidAmount && <p className="mt-1 text-xs text-red-600">{errors.paidAmount}</p>}
            </div>
          )}
        </div>

        {/* totals summary */}
        <div className="mt-4 space-y-1 rounded-xl bg-ink-900/[0.03] p-4 text-sm">
          <div className="flex justify-between"><span className="text-ink-600">Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
          {totals.totalDiscount > 0 && <div className="flex justify-between"><span className="text-ink-600">Discount</span><span>- {formatINR(totals.totalDiscount)}</span></div>}
          {gstType === 'SPLIT' && <div className="flex justify-between"><span className="text-ink-600">CGST</span><span>{formatINR(totals.cgst)}</span></div>}
          {gstType === 'SPLIT' && <div className="flex justify-between"><span className="text-ink-600">SGST</span><span>{formatINR(totals.sgst)}</span></div>}
          {gstType === 'IGST' && <div className="flex justify-between"><span className="text-ink-600">IGST</span><span>{formatINR(totals.igst)}</span></div>}
          {totals.roundOff !== 0 && <div className="flex justify-between"><span className="text-ink-600">Round Off</span><span>{formatINR(totals.roundOff)}</span></div>}
          <div className="flex justify-between border-t border-ink-900/10 pt-1.5 text-base font-bold text-ink-900"><span>Grand Total</span><span>{formatINR(totals.grandTotal)}</span></div>
          {paymentMethod === 'Credit' && (
            <div className="flex justify-between text-red-600 font-semibold"><span>Balance</span><span>{formatINR(Math.max(0, totals.grandTotal - (Number(paidAmount) || 0)))}</span></div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-16 lg:bottom-0 flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-lg border border-ink-900/10 sm:flex-row">
        <button onClick={() => handleSave('save')} className="btn-ghost flex-1"><Save size={16} /> Save Bill</button>
        <button onClick={() => handleSave('print')} className="btn-primary flex-1"><Printer size={16} /> Save & Print</button>
        <button onClick={() => handleSave('whatsapp')} className="btn-accent flex-1"><MessageCircle size={16} /> Save & WhatsApp</button>
      </div>
    </div>
  )
}
