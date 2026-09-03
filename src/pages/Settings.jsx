import React, { useRef, useState } from 'react'
import { Save, Download, Upload, FlaskConical, Trash2, ImagePlus } from 'lucide-react'
import { ConfirmDialog } from '../components/ui.jsx'

export default function Settings({ store }) {
  const { data, updateSettings, exportBackup, importBackup, clearAllData, loadDemoData, clearDemoData } = store
  const [form, setForm] = useState(data.settings)
  const [savedMsg, setSavedMsg] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const fileRef = useRef(null)
  const logoRef = useRef(null)

  function save() {
    updateSettings(form)
    setSavedMsg('Settings saved!')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  function handleLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, logo: reader.result }))
    reader.readAsDataURL(file)
  }

  function handleExport() {
    const json = exportBackup()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `Venkateswara_Lining_Works_Backup_${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importBackup(reader.result)
        alert('Backup restored successfully!')
      } catch (err) {
        alert('Could not read this backup file. Please check the file and try again.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function exportCSV(kind) {
    let rows = []
    if (kind === 'customers') {
      rows = [['Name', 'Mobile', 'Vehicle Number', 'Vehicle Model', 'Address'], ...data.customers.map(c => [c.name, c.mobile, c.vehicleNumber, c.vehicleModel, c.address])]
    } else if (kind === 'bills') {
      rows = [['Invoice No', 'Date', 'Customer', 'Amount', 'Paid', 'Balance', 'Status'], ...data.bills.map(b => [b.invoiceNo, b.date, b.customerSnapshot?.name, b.totals?.grandTotal, b.paidAmount, b.balanceAmount, b.status])]
    } else if (kind === 'products') {
      rows = [['Name', 'Category', 'HSN', 'Selling Price', 'GST %', 'Stock'], ...data.products.map(p => [p.name, p.category, p.hsn, p.sellingPrice, p.gstPercent, p.stock])]
    } else if (kind === 'expenses') {
      rows = [['Date', 'Category', 'Description', 'Amount', 'Payment Method'], ...data.expenses.map(e => [e.date, e.category, e.description, e.amount, e.paymentMethod])]
    }
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${kind}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-10">
      <h1 className="font-display text-2xl font-bold text-ink-900">Settings</h1>

      <div className="card space-y-3 p-5">
        <p className="font-display text-lg font-semibold text-ink-900">Shop Details</p>
        <Field label="Shop Name" value={form.shopName} onChange={v => setForm(f => ({ ...f, shopName: v }))} />
        <Field label="Tagline" value={form.tagline} onChange={v => setForm(f => ({ ...f, tagline: v }))} />
        <Field label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mobile" value={form.mobile} onChange={v => setForm(f => ({ ...f, mobile: v }))} />
          <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
        </div>
        <Field label="GSTIN" value={form.gstin} onChange={v => setForm(f => ({ ...f, gstin: v.toUpperCase() }))} />
        <div>
          <label className="label-field">Shop Logo</label>
          <div className="flex items-center gap-3">
            {form.logo && <img src={form.logo} className="h-12 max-w-[140px] rounded-lg border border-ink-900/10 object-contain p-1 bg-white" />}
            <button onClick={() => logoRef.current.click()} className="btn-ghost"><ImagePlus size={15} /> Upload Logo</button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          </div>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <p className="font-display text-lg font-semibold text-ink-900">Bank Details</p>
        <Field label="Bank Name" value={form.bankName} onChange={v => setForm(f => ({ ...f, bankName: v }))} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Account Number" value={form.accountNumber} onChange={v => setForm(f => ({ ...f, accountNumber: v }))} />
          <Field label="IFSC" value={form.ifsc} onChange={v => setForm(f => ({ ...f, ifsc: v.toUpperCase() }))} />
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <p className="font-display text-lg font-semibold text-ink-900">Invoice Numbering</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Invoice Prefix" value={form.invoicePrefix} onChange={v => setForm(f => ({ ...f, invoicePrefix: v.toUpperCase() }))} />
          <Field label="Financial Year" value={form.financialYear} onChange={v => setForm(f => ({ ...f, financialYear: v }))} />
        </div>
        <div>
          <label className="label-field">Next Invoice Number Sequence</label>
          <input type="number" className="input-field" value={form.nextInvoiceSeq} onChange={e => setForm(f => ({ ...f, nextInvoiceSeq: Number(e.target.value) || 1 }))} />
          <p className="mt-1 text-xs text-ink-600/70">Preview: {form.invoicePrefix}-{String(form.nextInvoiceSeq).padStart(3, '0')}/{form.financialYear}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} className="btn-accent"><Save size={16} /> Save Settings</button>
        {savedMsg && <span className="text-sm font-semibold text-emerald-600">{savedMsg}</span>}
      </div>

      <div className="card space-y-3 p-5">
        <p className="font-display text-lg font-semibold text-ink-900">Data Backup</p>
        <p className="text-sm text-ink-600">Download all your shop data as a single file. If you switch laptops or browsers, import this file to restore everything.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="btn-ghost"><Download size={15} /> Export Backup</button>
          <button onClick={() => fileRef.current.click()} className="btn-ghost"><Upload size={15} /> Import Backup</button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase text-ink-600/70">Export individual data (CSV)</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportCSV('customers')} className="btn-ghost !py-1.5 text-xs">Customers CSV</button>
          <button onClick={() => exportCSV('bills')} className="btn-ghost !py-1.5 text-xs">Bills CSV</button>
          <button onClick={() => exportCSV('products')} className="btn-ghost !py-1.5 text-xs">Products CSV</button>
          <button onClick={() => exportCSV('expenses')} className="btn-ghost !py-1.5 text-xs">Expenses CSV</button>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <p className="font-display text-lg font-semibold text-ink-900">Demo Data</p>
        <p className="text-sm text-ink-600">Load sample customers, products, and bills to explore the app. Demo records are clearly separate and can be removed anytime.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadDemoData} className="btn-ghost"><FlaskConical size={15} /> Load Demo Data</button>
          <button onClick={clearDemoData} className="btn-ghost">Clear Demo Data</button>
        </div>
      </div>

      <div className="card space-y-3 border-red-200 p-5">
        <p className="font-display text-lg font-semibold text-red-600">Danger Zone</p>
        <p className="text-sm text-ink-600">This permanently deletes all customers, bills, products, and expenses on this device. Export a backup first.</p>
        <button onClick={() => setConfirmClear(true)} className="btn-danger"><Trash2 size={15} /> Clear All Data</button>
      </div>

      <ConfirmDialog open={confirmClear} onClose={() => setConfirmClear(false)} onConfirm={clearAllData} title="Clear all data?" message="This will permanently delete everything. This cannot be undone. Make sure you've exported a backup." />
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <input className="input-field" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
