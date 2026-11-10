import React from 'react'
import { formatINR, formatDate, amountInWords } from '../lib/calc.js'

export default function InvoicePrint({ bill, settings, mode = 'a4' }) {
  const t = bill.totals || {}
  const isThermal = mode === 'thermal'

  return (
    <div id="print-invoice" className={isThermal ? 'thermal-invoice' : 'a4-invoice'}>
      <div className={isThermal ? 'w-[80mm] mx-auto p-2 text-[11px] font-mono text-black bg-white' : 'mx-auto max-w-[210mm] bg-white p-8 text-ink-900'}>
        {/* Header */}
        <div className={isThermal ? 'text-center border-b border-dashed border-black pb-2 mb-2' : 'flex items-start justify-between border-b-2 border-ink-900 pb-4'}>
          <div>
            {settings.logo && <img src={settings.logo} alt="logo" className={isThermal ? 'mx-auto h-12 mb-1 object-contain' : 'h-16 mb-2 object-contain'} />}
            <h1 className={isThermal ? 'font-bold text-sm' : 'font-display text-2xl font-bold tracking-wide'}>{settings.shopName}</h1>
            {settings.tagline && <p className={isThermal ? 'text-[10px] font-bold text-red-600 tracking-wider' : 'text-xs font-bold text-red-600 tracking-widest uppercase'}>{settings.tagline}</p>}
            <p className={isThermal ? 'text-[10px]' : 'text-sm text-ink-600'}>{settings.address}</p>
            {settings.mobile && <p className={isThermal ? 'text-[10px]' : 'text-sm text-ink-600'}>Ph: {settings.mobile}</p>}
            {settings.gstin && <p className={isThermal ? 'text-[10px]' : 'text-sm text-ink-600'}>GSTIN: {settings.gstin}</p>}
          </div>
          {!isThermal && (
            <div className="text-right">
              <p className="font-display text-lg font-bold uppercase tracking-wide">Tax Invoice</p>
              <p className="text-sm"><span className="text-ink-600">Invoice No: </span>{bill.invoiceNo}</p>
              <p className="text-sm"><span className="text-ink-600">Date: </span>{formatDate(bill.date)}</p>
            </div>
          )}
        </div>
        {isThermal && (
          <div className="text-center text-[10px] mb-2">
            <p>Invoice: {bill.invoiceNo}</p>
            <p>Date: {formatDate(bill.date)}</p>
          </div>
        )}

        {/* Bill to */}
        <div className={isThermal ? 'border-b border-dashed border-black py-2 mb-2 text-[10px]' : 'mt-4 grid grid-cols-2 gap-4 rounded-lg bg-ink-900/[0.03] p-3 text-sm'}>
          <div>
            <p className={isThermal ? '' : 'text-xs font-semibold uppercase text-ink-600'}>Bill To</p>
            <p className="font-semibold">{bill.customerSnapshot?.name}</p>
            <p>{bill.customerSnapshot?.mobile}</p>
            {bill.partyGstin && <p className={isThermal ? 'text-[10px]' : 'text-sm text-ink-700 font-medium'}>GSTIN: {bill.partyGstin}</p>}
          </div>
          <div className={isThermal ? '' : 'text-right'}>
            <p className={isThermal ? '' : 'text-xs font-semibold uppercase text-ink-600'}>Vehicle</p>
            <p>{bill.vehicleNumber}</p>
            <p>{bill.vehicleModel}</p>
          </div>
        </div>

        {/* Items table */}
        <table className={isThermal ? 'w-full mt-1 text-[10px]' : 'mt-4 w-full border-collapse text-sm'}>
          <thead>
            <tr className={isThermal ? 'border-b border-black' : 'border-b-2 border-ink-900 text-left'}>
              <th className="py-1 pr-1">#</th>
              <th className="py-1 pr-1">Item</th>
              {!isThermal && <th className="py-1 pr-1">HSN</th>}
              <th className="py-1 pr-1 text-right">Qty</th>
              <th className="py-1 pr-1 text-right">Rate</th>
              {!isThermal && <th className="py-1 pr-1 text-right">Taxable</th>}
              {!isThermal && bill.gstType === 'SPLIT' && <th className="py-1 pr-1 text-right">CGST</th>}
              {!isThermal && bill.gstType === 'SPLIT' && <th className="py-1 pr-1 text-right">SGST</th>}
              {!isThermal && bill.gstType === 'IGST' && <th className="py-1 pr-1 text-right">IGST</th>}
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(t.lines || []).map((l, i) => (
              <tr key={i} className={isThermal ? 'border-b border-dashed border-black/40' : 'border-b border-ink-900/10'}>
                <td className="py-1 pr-1">{i + 1}</td>
                <td className="py-1 pr-1">{bill.items[i]?.name}</td>
                {!isThermal && <td className="py-1 pr-1">{bill.items[i]?.hsn}</td>}
                <td className="py-1 pr-1 text-right">{bill.items[i]?.qty}</td>
                <td className="py-1 pr-1 text-right">{formatINR(bill.items[i]?.rate)}</td>
                {!isThermal && <td className="py-1 pr-1 text-right">{formatINR(l.taxable)}</td>}
                {!isThermal && bill.gstType === 'SPLIT' && <td className="py-1 pr-1 text-right">{formatINR(l.gstAmount / 2)}</td>}
                {!isThermal && bill.gstType === 'SPLIT' && <td className="py-1 pr-1 text-right">{formatINR(l.gstAmount / 2)}</td>}
                {!isThermal && bill.gstType === 'IGST' && <td className="py-1 pr-1 text-right">{formatINR(l.gstAmount)}</td>}
                <td className="py-1 text-right font-medium">{formatINR(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className={isThermal ? 'mt-2 border-t border-dashed border-black pt-2 text-[10px]' : 'mt-3 flex justify-end'}>
          <div className={isThermal ? 'space-y-0.5' : 'w-64 space-y-1 text-sm'}>
            <Row label="Subtotal" value={formatINR(t.subtotal)} />
            {t.totalDiscount > 0 && <Row label="Discount" value={`- ${formatINR(t.totalDiscount)}`} />}
            {bill.gstType === 'SPLIT' && <Row label="CGST" value={formatINR(t.cgst)} />}
            {bill.gstType === 'SPLIT' && <Row label="SGST" value={formatINR(t.sgst)} />}
            {bill.gstType === 'IGST' && <Row label="IGST" value={formatINR(t.igst)} />}
            {t.roundOff !== 0 && <Row label="Round Off" value={formatINR(t.roundOff)} />}
            <div className={isThermal ? 'border-t border-black pt-1 flex justify-between font-bold' : 'flex justify-between border-t-2 border-ink-900 pt-1 text-base font-bold'}>
              <span>Grand Total</span><span>{formatINR(t.grandTotal)}</span>
            </div>
            <Row label="Paid" value={formatINR(bill.paidAmount)} />
            {bill.balanceAmount > 0 && <Row label="Balance" value={formatINR(bill.balanceAmount)} highlight />}
          </div>
        </div>

        <p className={isThermal ? 'mt-2 text-[10px] italic' : 'mt-3 text-sm italic text-ink-700'}>
          {amountInWords(t.grandTotal)}
        </p>

        <p className={isThermal ? 'mt-1 text-[10px]' : 'mt-2 text-sm'}>
          <span className="font-semibold">Payment Mode:</span> {bill.paymentMethod}
        </p>

        {!isThermal && (settings.bankName || settings.accountNumber) && (
          <div className="mt-4 rounded-lg border border-ink-900/10 p-3 text-sm">
            <p className="text-xs font-semibold uppercase text-ink-600">Bank Details</p>
            {settings.bankName && <p>Bank: {settings.bankName}</p>}
            {settings.accountNumber && <p>A/C No: {settings.accountNumber}</p>}
            {settings.ifsc && <p>IFSC: {settings.ifsc}</p>}
          </div>
        )}

        {!isThermal ? (
          <div className="mt-8 flex items-end justify-between text-sm">
            <div className="max-w-xs text-xs text-ink-600">
              <p className="font-semibold">Declaration</p>
              <p>We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.</p>
            </div>
            <div className="text-center min-w-[200px]">
              <p className="text-xs font-semibold text-ink-700">For {settings.shopName || 'VENKATESWARA LINING WORKS'}</p>
              <div className="mb-6 h-12" />
              <p className="border-t border-ink-900 pt-1 text-sm font-semibold">Authorised Signatory</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 border-t border-dashed border-black pt-3 text-center text-[10px]">
            <p className="font-semibold">For {settings.shopName || 'VENKATESWARA LINING WORKS'}</p>
            <div className="my-3 h-6" />
            <p className="border-t border-dashed border-black pt-1">Authorised Signatory</p>
          </div>
        )}

        <p className={isThermal ? 'mt-2 text-center text-[9px]' : 'mt-6 text-center text-xs text-ink-600'}>
          Subject to Chennai Jurisdiction · Thank you for your business!
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className={`flex justify-between ${highlight ? 'font-bold text-red-600' : ''}`}>
      <span className="text-ink-600">{label}</span>
      <span>{value}</span>
    </div>
  )
}
