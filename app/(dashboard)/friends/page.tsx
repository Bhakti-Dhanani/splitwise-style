import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { UserPlus, User } from 'lucide-react'
import { getFriends } from '@/app/actions/friends'
import AddFriendDialog from '@/components/add-friend-dialog'

export default async function FriendsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const friends = await getFriends()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Friends</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your connections and view individual balances.
          </p>
        </div>
        <AddFriendDialog>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm">
            <UserPlus className="w-4 h-4" />
            Add Friend
          </button>
        </AddFriendDialog>
      </div>

      {friends.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No friends yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Add friends to split expenses with them directly, outside of groups.
          </p>
          <AddFriendDialog>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm">
              <UserPlus className="w-4 h-4" />
              Add Your First Friend
            </button>
          </AddFriendDialog>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend: any) => (
            <div key={friend.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {friend.image ? (
                  <img src={friend.image} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary">
                    {friend.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground truncate">{friend.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{friend.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
