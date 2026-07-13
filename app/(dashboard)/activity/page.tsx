import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Activity } from 'lucide-react'

export default async function ActivityPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review your recent expenses, settlements, and group changes.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          When you add expenses or settle up, your history will appear here.
        </p>
      </div>
    </div>
  )
}
