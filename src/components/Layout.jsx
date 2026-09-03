import React, { useState } from 'react'
import {
  LayoutDashboard, ReceiptText, FileStack, Users, Package,
  Truck, Wallet, BarChart3, CalendarCheck, Settings as SettingsIcon,
  Menu, X, Search, Bot
} from 'lucide-react'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'new-bill', label: 'New Bill', icon: ReceiptText },
  { key: 'bills', label: 'Bills', icon: FileStack },
  { key: 'ai-auditor', label: 'AI Auditor', icon: Bot },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'purchases', label: 'Purchases', icon: Truck },
  { key: 'expenses', label: 'Expenses', icon: Wallet },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'closing', label: 'Daily Closing', icon: CalendarCheck },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
]

const BOTTOM_NAV = ['dashboard', 'new-bill', 'bills', 'customers', 'reports']

export default function Layout({ page, setPage, shopName, onSearch, children, logo }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')

  const go = (key) => { setPage(key); setMenuOpen(false) }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink-950 lg:flex">
        <div className="flex flex-col gap-2 px-5 py-5 border-b border-white/10">
          {logo ? (
            <div className="rounded-lg bg-white p-2 shadow-sm flex items-center justify-center">
              <img src={logo} alt="logo" className="h-10 w-full object-contain" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass-400 font-display text-lg font-bold text-ink-950">V</div>
              <div>
                <p className="font-display text-base font-bold leading-tight text-white">{shopName}</p>
                <p className="text-[10px] uppercase tracking-widest text-brass-300">Billing Suite</p>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(item => (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                page === item.key ? 'bg-brass-400 text-ink-950' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 text-[10px] text-white/30">Data stored locally on this device</div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-900/10 bg-canvas/95 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setMenuOpen(true)} className="rounded-lg p-2 hover:bg-ink-900/5">
          <Menu size={22} />
        </button>
        <p className="font-display text-lg font-bold">{shopName}</p>
        <button onClick={() => setSearchOpen(true)} className="rounded-lg p-2 hover:bg-ink-900/5">
          <Search size={20} />
        </button>
      </header>

      {/* Desktop top bar with search */}
      <div className="hidden lg:block lg:ml-60">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-900/10 bg-canvas/95 px-8 py-3 backdrop-blur">
          <div className="relative w-80">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/50" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); onSearch?.(e.target.value) }}
              placeholder="Search invoice, customer, mobile, vehicle..."
              className="w-full rounded-lg border border-ink-700/15 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>
          <button onClick={() => go('new-bill')} className="btn-accent">+ New Bill</button>
        </div>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-40 bg-white p-4 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/50" />
              <input
                autoFocus
                value={q}
                onChange={e => { setQ(e.target.value); onSearch?.(e.target.value) }}
                placeholder="Search..."
                className="w-full rounded-lg border border-ink-700/15 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
            <button onClick={() => setSearchOpen(false)} className="rounded-lg p-2 hover:bg-ink-900/5"><X size={20} /></button>
          </div>
        </div>
      )}

      {/* Mobile drawer menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="w-64 bg-ink-950 p-4">
            <div className="mb-6 flex items-center justify-between">
              {logo ? (
                <div className="rounded-lg bg-white p-1.5 shadow-sm max-w-[170px]">
                  <img src={logo} alt="logo" className="h-8 w-full object-contain" />
                </div>
              ) : (
                <p className="font-display text-lg font-bold text-white">{shopName}</p>
              )}
              <button onClick={() => setMenuOpen(false)} className="text-white/70"><X size={20} /></button>
            </div>
            <nav className="space-y-1">
              {NAV.map(item => (
                <button
                  key={item.key}
                  onClick={() => go(item.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    page === item.key ? 'bg-brass-400 text-ink-950' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={17} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMenuOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="px-4 py-5 pb-24 lg:ml-60 lg:px-8 lg:py-6 lg:pb-10">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-900/10 bg-white lg:hidden">
        {BOTTOM_NAV.map(key => {
          const item = NAV.find(n => n.key === key)
          const active = page === key
          return (
            <button
              key={key}
              onClick={() => go(key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${active ? 'text-brass-500' : 'text-ink-600/60'}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}