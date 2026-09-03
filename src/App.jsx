import React, { useState } from 'react'
import { useStore } from './lib/store.js'
import Layout from './components/Layout.jsx'
import BillView from './components/BillView.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewBill from './pages/NewBill.jsx'
import Bills from './pages/Bills.jsx'
import Customers from './pages/Customers.jsx'
import Products from './pages/Products.jsx'
import Purchases from './pages/Purchases.jsx'
import Expenses from './pages/Expenses.jsx'
import Reports from './pages/Reports.jsx'
import DailyClosing from './pages/DailyClosing.jsx'
import Settings from './pages/Settings.jsx'
import { buildBillWhatsAppLink } from './lib/whatsapp.js'

import AIAuditor from './pages/AIAuditor.jsx'

export default function App() {
  const store = useStore()
  const [page, setPage] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewBillId, setViewBillId] = useState(null)
  const [editBillId, setEditBillId] = useState(null)

  function openBill(id) { setViewBillId(id) }
  function closeBillView() { setViewBillId(null) }

  function handleBillSaved(id, action) {
    setEditBillId(null)
    if (action === 'print') {
      setViewBillId(id)
      setTimeout(() => window.print(), 300)
    } else if (action === 'whatsapp') {
      const bill = store.data.bills.find(b => b.id === id)
      if (bill) {
        const link = buildBillWhatsAppLink(bill, store.data.settings)
        window.open(link, '_blank')
      }
      setViewBillId(id)
    } else {
      setViewBillId(id)
    }
    setPage('bills')
  }

  function handleEditBill(id) {
    setEditBillId(id)
    setViewBillId(null)
    setPage('new-bill')
  }

  function goNewBill() {
    setEditBillId(null)
    setPage('new-bill')
  }

  const viewedBill = viewBillId ? store.data.bills.find(b => b.id === viewBillId) : null

  return (
    <Layout page={page} setPage={(p) => { if (p === 'new-bill') goNewBill(); else setPage(p) }} shopName={store.data.settings.shopName} onSearch={setSearchQuery} logo={store.data.settings.logo}>
      {page === 'dashboard' && <Dashboard store={store} setPage={setPage} openBill={openBill} />}
      {page === 'new-bill' && <NewBill store={store} editBillId={editBillId} onSaved={handleBillSaved} goToBills={() => setPage('bills')} />}
      {page === 'bills' && <Bills store={store} openBill={openBill} searchQuery={searchQuery} />}
      {page === 'ai-auditor' && <AIAuditor store={store} />}
      {page === 'customers' && <Customers store={store} searchQuery={searchQuery} openBill={openBill} />}
      {page === 'products' && <Products store={store} searchQuery={searchQuery} />}
      {page === 'purchases' && <Purchases store={store} />}
      {page === 'expenses' && <Expenses store={store} />}
      {page === 'reports' && <Reports store={store} />}
      {page === 'closing' && <DailyClosing store={store} />}
      {page === 'settings' && <Settings store={store} />}

      {viewedBill && (
        <BillView
          bill={viewedBill}
          settings={store.data.settings}
          onClose={closeBillView}
          onEdit={handleEditBill}
          onDelete={(id) => store.deleteBill(id)}
        />
      )}
    </Layout>
  )
}