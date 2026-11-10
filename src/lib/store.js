import { useEffect, useState, useCallback, useRef } from 'react'
import { calcInvoice } from './calc.js'

const STORAGE_KEY = 'vlw_billing_data_v1'

// -------------------- default shape --------------------
function defaultData() {
  return {
    settings: {
      shopName: 'Venkateswara Lining Works',
      tagline: 'GET IT RENEWED',
      address: 'Chennai, Tamil Nadu',
      mobile: '',
      gstin: '33AIHPV3557A2ZC',
      email: '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
      invoicePrefix: 'VLW',
      financialYear: '26-27',
      logo: '/logo.png',
      nextInvoiceSeq: 1,
    },
    customers: [],   // {id, name, mobile, vehicleNumber, vehicleModel, address, createdAt}
    products: [],    // {id, name, category, hsn, purchasePrice, sellingPrice, gstPercent, stock, lowStockLimit}
    bills: [],       // {id, invoiceNo, date, customerId, customerSnapshot, vehicleNumber, vehicleModel, items, gstType, discount..., totals, paymentMethod, paidAmount, status, notes}
    purchases: [],   // {id, supplier, invoiceNo, date, productId, productName, qty, rate, gstPercent, total}
    expenses: [],    // {id, date, category, description, amount, paymentMethod}
    draftBill: null,
    isDemo: false,
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw)
    const defaults = defaultData()
    return {
      ...defaults,
      ...parsed,
      settings: {
        ...defaults.settings,
        ...(parsed.settings || {}),
        tagline: (parsed.settings && parsed.settings.tagline && parsed.settings.tagline !== 'Car Accessories & Lining Works') ? parsed.settings.tagline : 'GET IT RENEWED',
        logo: (parsed.settings && parsed.settings.logo) ? parsed.settings.logo : '/logo.png',
        gstin: (parsed.settings && parsed.settings.gstin && parsed.settings.gstin.trim()) ? parsed.settings.gstin : '33AIHPV3557A2ZC',
      }
    }
  } catch (e) {
    console.error('Failed to load data, starting fresh', e)
    return defaultData()
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// -------------------- the hook --------------------
export function useStore() {
  const [data, setData] = useState(load)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    save(data)
  }, [data])

  // generic setter that also persists immediately (for critical ops)
  const update = useCallback((fn) => {
    setData(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn
      save(next)
      return next
    })
  }, [])

  // ---------- settings ----------
  const updateSettings = useCallback((patch) => {
    update(prev => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [update])

  const nextInvoiceNumber = useCallback(() => {
    const s = data.settings
    const seq = String(s.nextInvoiceSeq).padStart(3, '0')
    return `${s.invoicePrefix}-${seq}/${s.financialYear}`
  }, [data.settings])

  // ---------- customers ----------
  const findCustomerByMobile = useCallback((mobile) => {
    return data.customers.find(c => c.mobile === mobile)
  }, [data.customers])

  const upsertCustomer = useCallback((customer) => {
    let result = customer
    update(prev => {
      const existingIdx = prev.customers.findIndex(c =>
        (customer.id && c.id === customer.id) || (customer.mobile && c.mobile === customer.mobile)
      )
      let customers
      if (existingIdx >= 0) {
        const merged = { ...prev.customers[existingIdx], ...customer }
        customers = [...prev.customers]
        customers[existingIdx] = merged
        result = merged
      } else {
        const created = { ...customer, id: customer.id || uid('cust'), createdAt: new Date().toISOString() }
        customers = [...prev.customers, created]
        result = created
      }
      return { ...prev, customers }
    })
    return result
  }, [update])

  const deleteCustomer = useCallback((id) => {
    update(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }))
  }, [update])

  // ---------- products ----------
  const upsertProduct = useCallback((product) => {
    update(prev => {
      const idx = prev.products.findIndex(p => p.id === product.id)
      let products
      if (idx >= 0) {
        products = [...prev.products]
        products[idx] = { ...products[idx], ...product }
      } else {
        products = [...prev.products, { ...product, id: product.id || uid('prod') }]
      }
      return { ...prev, products }
    })
  }, [update])

  const deleteProduct = useCallback((id) => {
    update(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }))
  }, [update])

  const adjustStock = useCallback((productId, delta) => {
    update(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === productId ? { ...p, stock: Math.max(0, (Number(p.stock) || 0) + delta) } : p)
    }))
  }, [update])

  // ---------- bills ----------
  const saveBill = useCallback((bill) => {
    let saved = bill
    update(prev => {
      const totals = calcInvoice(bill.items, bill.gstType)
      const grandTotal = totals.grandTotal
      const paid = Number(bill.paidAmount) || 0
      const status = bill.paymentMethod === 'Credit'
        ? (paid <= 0 ? 'Pending' : paid < grandTotal ? 'Partially Paid' : 'Paid')
        : 'Paid'

      const isNew = !bill.id
      const record = {
        ...bill,
        id: bill.id || uid('bill'),
        totals,
        status,
        paidAmount: bill.paymentMethod === 'Credit' ? paid : grandTotal,
        balanceAmount: bill.paymentMethod === 'Credit' ? Math.max(0, round2safe(grandTotal - paid)) : 0,
        updatedAt: new Date().toISOString(),
        createdAt: bill.createdAt || new Date().toISOString(),
      }
      saved = record

      let bills
      if (isNew) {
        bills = [...prev.bills, record]
      } else {
        bills = prev.bills.map(b => b.id === record.id ? record : b)
      }

      let products = prev.products
      if (isNew) {
        // decrement stock for matched products
        record.items.forEach(item => {
          if (item.productId) {
            products = products.map(p => p.id === item.productId
              ? { ...p, stock: Math.max(0, (Number(p.stock) || 0) - (Number(item.qty) || 0)) }
              : p)
          }
        })
      }

      const settings = isNew
        ? { ...prev.settings, nextInvoiceSeq: prev.settings.nextInvoiceSeq + 1 }
        : prev.settings

      return { ...prev, bills, products, settings, draftBill: null }
    })
    return saved
  }, [update])

  const deleteBill = useCallback((id) => {
    update(prev => ({ ...prev, bills: prev.bills.filter(b => b.id !== id) }))
  }, [update])

  const saveDraft = useCallback((draft) => {
    update(prev => ({ ...prev, draftBill: draft }))
  }, [update])

  const clearDraft = useCallback(() => {
    update(prev => ({ ...prev, draftBill: null }))
  }, [update])

  // ---------- purchases ----------
  const addPurchase = useCallback((purchase) => {
    update(prev => {
      const record = { ...purchase, id: uid('pur'), createdAt: new Date().toISOString() }
      let products = prev.products
      if (purchase.productId) {
        products = products.map(p => p.id === purchase.productId
          ? { ...p, stock: (Number(p.stock) || 0) + (Number(purchase.qty) || 0) }
          : p)
      }
      return { ...prev, purchases: [...prev.purchases, record], products }
    })
  }, [update])

  const deletePurchase = useCallback((id) => {
    update(prev => ({ ...prev, purchases: prev.purchases.filter(p => p.id !== id) }))
  }, [update])

  // ---------- expenses ----------
  const addExpense = useCallback((expense) => {
    update(prev => ({ ...prev, expenses: [...prev.expenses, { ...expense, id: uid('exp') }] }))
  }, [update])

  const deleteExpense = useCallback((id) => {
    update(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }))
  }, [update])

  // ---------- backup ----------
  const exportBackup = useCallback(() => {
    return JSON.stringify(data, null, 2)
  }, [data])

  const importBackup = useCallback((json) => {
    const parsed = JSON.parse(json)
    update(() => ({ ...defaultData(), ...parsed }))
  }, [update])

  const clearAllData = useCallback(() => {
    update(() => defaultData())
  }, [update])

  // ---------- demo data ----------
  const loadDemoData = useCallback(() => {
    update(prev => buildDemoData(prev))
  }, [update])

  const clearDemoData = useCallback(() => {
    update(prev => ({
      ...prev,
      customers: prev.customers.filter(c => !c.isDemo),
      products: prev.products.filter(p => !p.isDemo),
      bills: prev.bills.filter(b => !b.isDemo),
      expenses: prev.expenses.filter(e => !e.isDemo),
      isDemo: false,
    }))
  }, [update])

  return {
    data,
    updateSettings,
    nextInvoiceNumber,
    findCustomerByMobile,
    upsertCustomer,
    deleteCustomer,
    upsertProduct,
    deleteProduct,
    adjustStock,
    saveBill,
    deleteBill,
    saveDraft,
    clearDraft,
    addPurchase,
    deletePurchase,
    addExpense,
    deleteExpense,
    exportBackup,
    importBackup,
    clearAllData,
    loadDemoData,
    clearDemoData,
  }
}

function round2safe(n) { return Math.round((Number(n) || 0) * 100) / 100 }

// -------------------- demo data builder --------------------
function buildDemoData(prev) {
  const names = ['Ravi Kumar', 'Suresh Babu', 'Karthik R', 'Deepa Shree', 'Anand Prakash']
  const vehicles = ['TN 09 AB 1234', 'TN 22 CD 5678', 'TN 07 EF 9012', 'TN 10 GH 3456', 'TN 04 IJ 7890']
  const models = ['Hyundai i20', 'Maruti Swift', 'Honda City', 'Tata Nexon', 'Toyota Innova']

  const customers = names.map((n, i) => ({
    id: uid('cust'), name: n, mobile: `98765${(43210 + i).toString().slice(-5)}`,
    vehicleNumber: vehicles[i], vehicleModel: models[i], address: 'Chennai',
    createdAt: new Date().toISOString(), isDemo: true,
  }))

  const productDefs = [
    ['Seat Cover (Leather)', 'Seat Cover', '9401', 3500, 8000, 18],
    ['Floor Mat Set', 'Floor Mat', '5705', 900, 2200, 12],
    ['Steering Cover', 'Steering Cover', '8708', 250, 700, 18],
    ['Door Pad Lining', 'Accessories', '9401', 1200, 3000, 18],
    ['Roof Lining Fabric', 'Fitting', '5407', 1500, 3500, 12],
    ['Car Carpet', 'Floor Mat', '5705', 700, 1800, 12],
    ['Dashboard Camera', 'Accessories', '8525', 2000, 4500, 18],
    ['Fitting Labour', 'Fitting', '9987', 0, 500, 18],
    ['LED Interior Light Kit', 'Accessories', '8539', 400, 1200, 18],
    ['Leather Armrest', 'Accessories', '9401', 600, 1500, 18],
  ]
  const products = productDefs.map(([name, category, hsn, purchasePrice, sellingPrice, gstPercent], i) => ({
    id: uid('prod'), name, category, hsn, purchasePrice, sellingPrice, gstPercent,
    stock: [2, 15, 20, 5, 8, 12, 3, 999, 10, 6][i], lowStockLimit: 5, isDemo: true,
  }))

  let seq = prev.settings.nextInvoiceSeq
  const bills = []
  for (let i = 0; i < 10; i++) {
    const cust = customers[i % customers.length]
    const prod = products[i % products.length]
    const prod2 = products[(i + 3) % products.length]
    const items = [
      { id: uid('li'), name: prod.name, hsn: prod.hsn, qty: 1, rate: prod.sellingPrice, discountType: 'amount', discountValue: 0, gstPercent: prod.gstPercent, productId: prod.id },
      { id: uid('li'), name: prod2.name, hsn: prod2.hsn, qty: 1, rate: prod2.sellingPrice, discountType: 'amount', discountValue: 0, gstPercent: prod2.gstPercent, productId: prod2.id },
    ]
    const totals = calcInvoice(items, 'SPLIT')
    const paymentMethod = ['Cash', 'UPI', 'Card', 'Credit', 'Bank Transfer'][i % 5]
    const paid = paymentMethod === 'Credit' ? Math.round(totals.grandTotal * 0.5) : totals.grandTotal
    const daysAgo = i * 2
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10)
    bills.push({
      id: uid('bill'),
      invoiceNo: `${prev.settings.invoicePrefix}-${String(seq).padStart(3, '0')}/${prev.settings.financialYear}`,
      date,
      customerId: cust.id,
      customerSnapshot: { name: cust.name, mobile: cust.mobile },
      vehicleNumber: cust.vehicleNumber,
      vehicleModel: cust.vehicleModel,
      items,
      gstType: 'SPLIT',
      paymentMethod,
      paidAmount: paid,
      balanceAmount: Math.max(0, totals.grandTotal - paid),
      status: paymentMethod === 'Credit' ? (paid < totals.grandTotal ? 'Partially Paid' : 'Paid') : 'Paid',
      totals,
      notes: '',
      createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      isDemo: true,
    })
    seq++
  }

  const expenseDefs = [
    ['Rent', 'Shop rent - monthly', 15000, 'Bank Transfer'],
    ['Electricity', 'EB bill', 3200, 'UPI'],
    ['Material', 'Leather roll purchase', 8500, 'Cash'],
    ['Transport', 'Material transport', 900, 'Cash'],
    ['Salary', 'Staff salary advance', 6000, 'Cash'],
  ]
  const expenses = expenseDefs.map(([category, description, amount, paymentMethod], i) => ({
    id: uid('exp'),
    date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
    category, description, amount, paymentMethod, isDemo: true,
  }))

  return {
    ...prev,
    customers: [...prev.customers, ...customers],
    products: [...prev.products, ...products],
    bills: [...prev.bills, ...bills],
    expenses: [...prev.expenses, ...expenses],
    settings: { ...prev.settings, nextInvoiceSeq: seq },
    isDemo: true,
  }
}

export { uid }
