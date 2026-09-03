import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className={`w-full ${widths[size]} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-ink-700/10 bg-white px-5 py-4">
          <h3 className="font-display text-xl font-semibold tracking-wide text-ink-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-600 hover:bg-ink-900/5">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, accent = false, sub }) {
  return (
    <div className={`card p-4 ${accent ? 'bg-ink-900 text-white' : ''}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-brass-300' : 'text-ink-600'}`}>{label}</span>
        {Icon && <Icon size={16} className={accent ? 'text-brass-300' : 'text-ink-600'} />}
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${accent ? 'text-white' : 'text-ink-900'}`}>{value}</div>
      {sub && <div className={`mt-1 text-xs ${accent ? 'text-white/60' : 'text-ink-600/70'}`}>{sub}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-ink-900/5 text-ink-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  }
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-700/15 py-14 text-center">
      {Icon && <Icon size={32} className="mb-3 text-ink-600/40" />}
      <p className="font-display text-lg font-semibold text-ink-800">{title}</p>
      {sub && <p className="mt-1 max-w-xs text-sm text-ink-600/70">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-ink-700">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-danger" onClick={() => { onConfirm(); onClose(); }}>Delete</button>
      </div>
    </Modal>
  )
}
