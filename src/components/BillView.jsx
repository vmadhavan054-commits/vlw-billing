import React, { useState } from 'react'
import { Printer, MessageCircle, Edit3, Trash2, X, FileDown } from 'lucide-react'
import InvoicePrint from './InvoicePrint.jsx'
import { buildBillWhatsAppLink } from '../lib/whatsapp.js'
import { ConfirmDialog } from './ui.jsx'

export default function BillView({ bill, settings, onClose, onEdit, onDelete }) {
  const [mode, setMode] = useState('a4')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!bill) return null

  function handlePrint() {
    document.body.classList.toggle('print-thermal', mode === 'thermal')
    window.print()
  }

  const waLink = buildBillWhatsAppLink(bill, settings)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40">
      <div className="no-print flex items-center justify-between bg-ink-950 px-4 py-3 text-white">
        <p className="font-display text-lg font-semibold">{bill.invoiceNo}</p>
        <div className="flex items-center gap-1">
          <div className="mr-2 hidden items-center gap-1 rounded-lg bg-white/10 p-1 text-xs sm:flex">
            <button onClick={() => setMode('a4')} className={`rounded-md px-2 py-1 ${mode === 'a4' ? 'bg-white text-ink-950' : ''}`}>A4</button>
            <button onClick={() => setMode('thermal')} className={`rounded-md px-2 py-1 ${mode === 'thermal' ? 'bg-white text-ink-950' : ''}`}>80mm</button>
          </div>
          <button onClick={() => onEdit(bill.id)} className="rounded-lg p-2 hover:bg-white/10"><Edit3 size={18} /></button>
          <button onClick={() => setConfirmDelete(true)} className="rounded-lg p-2 hover:bg-white/10"><Trash2 size={18} /></button>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10"><X size={18} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-ink-900/20 py-6">
        <InvoicePrint bill={bill} settings={settings} mode={mode} />
      </div>

      <div className="no-print flex flex-col gap-2 border-t border-white/10 bg-ink-950 p-3 sm:flex-row">
        <button onClick={handlePrint} className="btn-ghost flex-1 !bg-white"><Printer size={16} /> Print</button>
        <button onClick={handlePrint} className="btn-ghost flex-1 !bg-white"><FileDown size={16} /> Save as PDF</button>
        <a href={waLink} target="_blank" rel="noreferrer" className="btn-accent flex-1"><MessageCircle size={16} /> Send on WhatsApp</a>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { onDelete(bill.id); onClose(); }}
        message={`Delete invoice ${bill.invoiceNo}? This cannot be undone.`}
      />
    </div>
  )
}
