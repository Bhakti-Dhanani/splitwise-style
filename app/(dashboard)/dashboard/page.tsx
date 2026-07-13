import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Balance</h3>
          </div>
          <div className="text-2xl font-bold">$0.00</div>
          <p className="text-xs text-muted-foreground mt-1">
            You are completely settled up.
          </p>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-destructive">You Owe</h3>
          </div>
          <div className="text-2xl font-bold text-destructive">$0.00</div>
          <p className="text-xs text-muted-foreground mt-1">
            Nothing owed to others.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-emerald-600 dark:text-emerald-500">You Are Owed</h3>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">$0.00</div>
          <p className="text-xs text-muted-foreground mt-1">
            No pending collections.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6 border-b border-border">
          <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Your recent group transactions</p>
        </div>
        <div className="p-6 text-center text-muted-foreground py-12 text-sm">
          No recent activity to show.
        </div>
      </div>
    </div>
  )
}
