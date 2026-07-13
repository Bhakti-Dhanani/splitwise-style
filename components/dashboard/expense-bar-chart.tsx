'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

interface ExpenseBarChartProps {
  data: { date: string; amount: number }[]
  currency: string
}

export function ExpenseBarChart({ data, currency }: ExpenseBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground border rounded-xl bg-card shadow-sm">
        No expenses found for this period.
      </div>
    )
  }

  const dateFormatter = (dateStr: string) => {
    if (/^[A-Za-z]{3}$/.test(dateStr)) return dateStr
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
  }

  const formattedData = data.map(item => ({
    ...item,
    formattedDate: dateFormatter(item.date)
  }))

  return (
    <div className="h-[350px] w-full border rounded-xl bg-card shadow-sm p-4 flex flex-col">
      <h3 className="font-semibold mb-4 text-center">Expenses Over Time</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              formatter={(value: any) => [`${currency} ${Number(value).toFixed(2)}`, 'Amount']}
              labelStyle={{ color: '#000' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
