'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function DateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get('filter') || 'this_month'

  const handleFilterChange = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('filter', value)
    router.push(`?${params.toString()}`)
    router.refresh()
  }

  const labels: Record<string, string> = {
    last_7_days: 'Last 7 Days',
    last_30_days: 'Last 30 Days',
    this_month: 'This Month',
    this_year: 'This Year',
    all_time: 'All Time',
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Filter by date:</span>
      <Select value={currentFilter} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select date range">
            {labels[currentFilter] || 'Select date range'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="last_7_days">Last 7 Days</SelectItem>
          <SelectItem value="last_30_days">Last 30 Days</SelectItem>
          <SelectItem value="this_month">This Month</SelectItem>
          <SelectItem value="this_year">This Year</SelectItem>
          <SelectItem value="all_time">All Time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
