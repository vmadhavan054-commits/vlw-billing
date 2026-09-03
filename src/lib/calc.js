// ===================================================================
// Reusable business-logic / calculation utilities.
// NOTHING is hardcoded here — every total is derived from real inputs.
// ===================================================================

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

/**
 * Calculate a single line item.
 * taxable = qty*rate - discount
 * gstAmount = taxable * gst%
 * total = taxable + gstAmount
 */
export function calcLineItem(item) {
  const qty = Number(item.qty) || 0
  const rate = Number(item.rate) || 0
  const gross = qty * rate
  let discount = 0
  if (item.discountType === 'percent') {
    discount = gross * ((Number(item.discountValue) || 0) / 100)
  } else {
    discount = Number(item.discountValue) || 0
  }
  discount = Math.min(discount, gross)
  const taxable = round2(gross - discount)
  const gstPercent = Number(item.gstPercent) || 0
  const gstAmount = round2(taxable * (gstPercent / 100))
  const total = round2(taxable + gstAmount)
  return { gross: round2(gross), discount: round2(discount), taxable, gstAmount, total, gstPercent }
}

/**
 * Calculate the full invoice from a list of line items + gstType.
 * gstType: 'SPLIT' (CGST+SGST) | 'IGST' | 'NONE'
 */
export function calcInvoice(items, gstType = 'SPLIT') {
  const lines = items.map(calcLineItem)
  const subtotal = round2(lines.reduce((s, l) => s + l.gross, 0))
  const totalDiscount = round2(lines.reduce((s, l) => s + l.discount, 0))
  const taxableTotal = round2(lines.reduce((s, l) => s + l.taxable, 0))
  const gstTotal = round2(lines.reduce((s, l) => s + l.gstAmount, 0))

  let cgst = 0, sgst = 0, igst = 0
  if (gstType === 'SPLIT') {
    cgst = round2(gstTotal / 2)
    sgst = round2(gstTotal / 2)
  } else if (gstType === 'IGST') {
    igst = gstTotal
  }

  const preRound = round2(taxableTotal + gstTotal)
  const grandTotal = Math.round(preRound)
  const roundOff = round2(grandTotal - preRound)

  return {
    lines,
    subtotal,
    totalDiscount,
    taxableTotal,
    gstTotal,
    cgst,
    sgst,
    igst,
    roundOff,
    grandTotal,
  }
}

// ---------- Number to Indian words ----------
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n) {
  if (n < 20) return ONES[n]
  const t = Math.floor(n / 10)
  const o = n % 10
  return TENS[t] + (o ? ' ' + ONES[o] : '')
}

function threeDigits(n) {
  const h = Math.floor(n / 100)
  const rest = n % 100
  let str = ''
  if (h) str += ONES[h] + ' Hundred'
  if (rest) str += (str ? ' ' : '') + twoDigits(rest)
  return str
}

export function numberToIndianWords(num) {
  num = Math.round(Number(num) || 0)
  if (num === 0) return 'Zero'
  const crore = Math.floor(num / 10000000)
  num %= 10000000
  const lakh = Math.floor(num / 100000)
  num %= 100000
  const thousand = Math.floor(num / 1000)
  num %= 1000
  const hundred = num

  const parts = []
  if (crore) parts.push(threeDigits(crore) + ' Crore')
  if (lakh) parts.push(threeDigits(lakh) + ' Lakh')
  if (thousand) parts.push(threeDigits(thousand) + ' Thousand')
  if (hundred) parts.push(threeDigits(hundred))

  return parts.join(' ')
}

export function amountInWords(amount) {
  const rupees = Math.floor(amount)
  return `Rupees ${numberToIndianWords(rupees)} Only`
}

export function formatINR(n) {
  const num = Number(n) || 0
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
}

export function formatDate(d) {
  const date = new Date(d)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// GST% -> split preset (for display / quick pick)
export const GST_PRESETS = [0, 5, 12, 18, 28]
