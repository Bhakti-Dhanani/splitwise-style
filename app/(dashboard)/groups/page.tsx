import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getGroupsService } from '@/services/group.service'
import GroupsList from '@/components/groups-list'
import CreateGroupDialog from '@/components/create-group-dialog'
import { Plus } from 'lucide-react'

export default async function GroupsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const groups = await getGroupsService(session.user.id)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your shared expenses across different groups.
          </p>
        </div>
        <CreateGroupDialog>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            New Group
          </button>
        </CreateGroupDialog>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-8 md:p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No groups yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Get started by creating a group to split expenses with friends, roommates, or family.
          </p>
          <CreateGroupDialog>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm w-full sm:w-auto justify-center">
              <Plus className="w-4 h-4" />
              Create Group
            </button>
          </CreateGroupDialog>
        </div>
      ) : (
        <GroupsList groups={groups} />
      )}
    </div>
  )
}
