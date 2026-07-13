import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getGroups } from '@/app/actions/groups'
import GroupsList from '@/components/groups-list'
import CreateGroupDialog from '@/components/create-group-dialog'
import { Plus } from 'lucide-react'

export default async function GroupsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const groups = await getGroups()

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fair Path</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your shared expenses with ease
              </p>
            </div>
            <div className="flex items-center gap-4">
              <CreateGroupDialog>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                  <Plus className="w-4 h-4" />
                  New Group
                </button>
              </CreateGroupDialog>
              <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {session.user.name || session.user.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No groups yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first group to start splitting expenses
            </p>
            <CreateGroupDialog>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                <Plus className="w-5 h-5" />
                Create Group
              </button>
            </CreateGroupDialog>
          </div>
        ) : (
          <GroupsList groups={groups} />
        )}
      </div>
    </main>
  )
}
