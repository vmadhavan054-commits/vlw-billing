import { formatINR, formatDate } from './calc.js'

export function buildBillWhatsAppLink(bill, settings) {
  let mobile = (bill.customerSnapshot?.mobile || '').replace(/\D/g, '')
  if (mobile.length === 10) mobile = '91' + mobile

  const lines = [
    `Dear ${bill.customerSnapshot?.name || 'Customer'},`,
    '',
    `Thank you for visiting ${settings.shopName}.`,
    '',
    `Invoice No: ${bill.invoiceNo}`,
    `Date: ${formatDate(bill.date)}`,
    bill.vehicleNumber ? `Vehicle: ${bill.vehicleNumber}` : null,
    `Total Amount: ${formatINR(bill.totals?.grandTotal)}`,
    `Paid: ${formatINR(bill.paidAmount)}`,
    bill.balanceAmount > 0 ? `Balance: ${formatINR(bill.balanceAmount)}` : null,
    '',
    'Thank you!',
  ].filter(Boolean)

  const text = encodeURIComponent(lines.join('\n'))
  return mobile
    ? `https://wa.me/${mobile}?text=${text}`
    : `https://wa.me/?text=${text}`
}
