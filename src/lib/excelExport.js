import * as XLSX from 'xlsx'

export function exportBillsToExcel(bills) {
  const data = bills.map(b => ({
    'Invoice No': b.invoiceNo,
    'Date': b.date,
    'Customer Name': b.customerSnapshot?.name || 'Unknown',
    'Mobile': b.customerSnapshot?.mobile || '',
    'Vehicle No': b.vehicleNumber || '',
    'Vehicle Model': b.vehicleModel || '',
    'Payment Method': b.paymentMethod,
    'Taxable Value (₹)': b.totals.taxableValue,
    'GST Amount (₹)': b.totals.totalGst,
    'Grand Total (₹)': b.totals.grandTotal,
    'Paid Amount (₹)': b.paidAmount,
    'Balance (₹)': b.balanceAmount,
    'Status': b.status
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Bills')
  XLSX.writeFile(wb, `Sales_Bills_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportPurchasesToExcel(purchases) {
  const data = purchases.map(p => ({
    'Purchase Date': p.date,
    'Supplier': p.supplier,
    'Invoice No': p.invoiceNo,
    'Product Name': p.productName,
    'Quantity': p.qty,
    'Rate (₹)': p.rate,
    'GST %': p.gstPercent,
    'Total Amount (₹)': p.total
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Purchase Bills')
  XLSX.writeFile(wb, `Purchases_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
