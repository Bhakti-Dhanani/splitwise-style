import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getDashboardDataService, getDashboardChartsDataService } from '@/services/dashboard.service'
import { ACTIVITY_ACTIONS } from '@/constants'
import { formatDistanceToNow } from 'date-fns'
import { db } from '@/lib/db'

import { Pagination } from '@/components/ui/pagination'
import { DateFilter } from '@/components/dashboard/date-filter'
import { ExpensePieChart } from '@/components/dashboard/expense-pie-chart'
import { ExpenseBarChart } from '@/components/dashboard/expense-bar-chart'
import { ActivitySearch } from '@/components/dashboard/activity-search'
import { Suspense } from 'react'

export default async function DashboardPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) return null

  const user = await db.user.findUnique({
    where: { id: session.user.id }
  })
  const defaultCurrency = (user as any)?.defaultCurrency || 'USD'

  const searchParams = props.searchParams ? await Promise.resolve(props.searchParams) : undefined
  const page = Number(searchParams?.page) || 1
  const limit = 10
  const filter = String(searchParams?.filter || 'this_month')
  const search = String(searchParams?.search || '')

  const { youOwe, youAreOwed, totalBalance, recentActivity, totalActivities } = await getDashboardDataService(page, limit, search)
  const { pieChartData, barChartData } = await getDashboardChartsDataService(filter)
  const totalPages = Math.ceil((totalActivities || 0) / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <DateFilter />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Balance</h3>
          </div>
          <div className={`text-2xl font-bold ${totalBalance > 0 ? 'text-emerald-600 dark:text-emerald-500' : totalBalance < 0 ? 'text-destructive' : ''}`}>
            {defaultCurrency} {Math.abs(totalBalance).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalBalance === 0 ? 'You are completely settled up.' : totalBalance > 0 ? 'You are owed overall.' : 'You owe overall.'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-destructive">You Owe</h3>
          </div>
          <div className="text-2xl font-bold text-destructive">{defaultCurrency} {youOwe.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {youOwe === 0 ? 'Nothing owed to others.' : 'Total outstanding debt.'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-emerald-600 dark:text-emerald-500">You Are Owed</h3>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{defaultCurrency} {youAreOwed.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {youAreOwed === 0 ? 'No pending collections.' : 'Total expected to receive.'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ExpensePieChart data={pieChartData} currency={defaultCurrency} />
        <ExpenseBarChart data={barChartData} currency={defaultCurrency} />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col space-y-4 p-6 border-b border-border">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Your recent group transactions</p>
          </div>
          <Suspense fallback={<div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>}>
            <ActivitySearch />
          </Suspense>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground py-12 text-sm">
              No recent activity to show.
            </div>
          ) : (
            recentActivity.map((activity: any) => (
              <div key={activity.id} className="p-6 flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold uppercase">
                  {activity.user.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{activity.user.name}</span>{' '}
                    {activity.details}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                    {activity.group && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-medium text-primary">
                          {activity.group.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-center pb-6">
            <Pagination totalPages={totalPages} currentPage={page} />
          </div>
        )}
      </div>
    </div>
  )
}
