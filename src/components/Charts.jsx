import React from 'react'

// Simple responsive bar chart, no dependency needed.
export function BarChart({ data, valueKey = 'value', labelKey = 'label', height = 160, color = '#dba934' }) {
  if (!data || data.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-ink-600/50">No data yet</div>
  }
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(4, (d[valueKey] / max) * (height - 30))
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-semibold text-ink-700">{d[valueKey] > 0 ? d[valueKey].toLocaleString('en-IN') : ''}</span>
            <div className="w-full rounded-t-md transition-all" style={{ height: h, background: color }} />
            <span className="mt-1 truncate w-full text-center text-[10px] text-ink-600/70">{d[labelKey]}</span>
          </div>
        )
      })}
    </div>
  )
}

// Simple donut / segmented list for payment-method style breakdowns.
export function SegmentBars({ data, valueKey = 'value', labelKey = 'label' }) {
  const total = data.reduce((s, d) => s + (d[valueKey] || 0), 0) || 1
  const palette = ['#dba934', '#4a5567', '#c1902a', '#313b49', '#e9c05a', '#191f27']
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const pct = ((d[valueKey] || 0) / total) * 100
        return (
          <div key={i}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-ink-800">{d[labelKey]}</span>
              <span className="text-ink-600/70">₹{(d[valueKey] || 0).toLocaleString('en-IN')} ({pct.toFixed(0)}%)</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-900/5">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: palette[i % palette.length] }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
