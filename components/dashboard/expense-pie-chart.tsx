'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts'
import { useMemo } from 'react'

interface ExpensePieChartProps {
  data: { name: string; value: number }[]
  currency: string
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316'  // orange
]

export function ExpensePieChart({ data, currency }: ExpensePieChartProps) {

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground border rounded-xl bg-card shadow-sm">
        No expenses found for this period.
      </div>
    )
  }

  return (
    <div className="h-[350px] w-full border rounded-xl bg-card shadow-sm p-4 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400 opacity-50"></div>
      <h3 className="font-semibold mb-2 text-center text-foreground">Expenses by Category</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={110}
              paddingAngle={0}
              minAngle={15}
              dataKey="value"
              stroke="transparent"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  style={{
                    filter: `drop-shadow(0px 4px 6px rgba(0,0,0,0.1))`
                  }}
                />
              ))}

            </Pie>
            <Tooltip
              formatter={(value: any) => [`${currency} ${Number(value).toFixed(2)}`, 'Amount']}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                backgroundColor: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                fontWeight: 500
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-foreground font-medium text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
