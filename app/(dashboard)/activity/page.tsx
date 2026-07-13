import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Activity, PlusCircle, UserPlus, CheckCircle2, Trash2 } from 'lucide-react'
import { getRecentActivityService } from '@/services/activity.service'
import Link from 'next/link'

function getActivityIcon(action: string) {
  switch (action) {
    case 'GROUP_CREATED':
    case 'EXPENSE_ADDED':
      return <PlusCircle className="w-4 h-4 text-primary" />
    case 'MEMBER_ADDED':
    case 'FRIEND_ADDED':
      return <UserPlus className="w-4 h-4 text-blue-500" />
    case 'SETTLEMENT_COMPLETED':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'EXPENSE_DELETED':
      return <Trash2 className="w-4 h-4 text-destructive" />
    default:
      return <Activity className="w-4 h-4 text-muted-foreground" />
  }
}

import { Pagination } from '@/components/ui/pagination'

export default async function ActivityPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const searchParams = props.searchParams ? await Promise.resolve(props.searchParams) : undefined
  const page = Number(searchParams?.page) || 1
  const limit = 10

  const { activities, totalActivities } = await getRecentActivityService(undefined, page, limit)
  const totalPages = Math.ceil((totalActivities || 0) / limit)

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

      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Actions like adding expenses, inviting friends, and creating groups will appear here.
          </p>
        </div>
      ) : (
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {activities.map((activity: any, idx: number) => (
            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                {getActivityIcon(activity.action)}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  {activity.user.image ? (
                    <img src={activity.user.image} alt={activity.user.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {activity.user.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{activity.user.name}</span>
                    <span>&bull;</span>
                    <time dateTime={activity.createdAt.toISOString()}>
                      {activity.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </time>
                  </div>
                </div>
                <div className="text-foreground font-medium">
                  {activity.details}
                </div>
                {activity.group && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">in </span>
                    <Link href={`/groups/${activity.groupId}`} className="text-primary hover:underline font-medium">
                      {activity.group.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination totalPages={totalPages} currentPage={page} />
      )}
    </div>
  )
}
