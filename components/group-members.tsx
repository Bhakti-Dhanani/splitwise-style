'use client'

import { useState } from 'react'
import { addMemberToGroupService, removeMemberFromGroupService } from '@/services/group.service'
import { Plus, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Member } from '@/types'

export default function GroupMembers({
  groupId,
  members,
  currentUserId,
  groupOwnerId,
}: {
  groupId: string
  members: Member[]
  currentUserId: string
  groupOwnerId: string
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const userId = formData.get('userId') as string

    try {
      await addMemberToGroupService({ groupId, userId: userId })
      setShowAddForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, isSelf: boolean) => {
    const msg = isSelf ? 'Are you sure you want to leave this group?' : 'Remove this member from the group?'
    if (!confirm(msg)) return
    try {
      await removeMemberFromGroupService(groupId, memberId)
      if (isSelf) {
        router.push('/groups')
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to remove member:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Members</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length} {members.length === 1 ? 'member' : 'members'} in this group
          </p>
        </div>
        {currentUserId === groupOwnerId && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddMember}
          className="p-6 bg-card border border-border rounded-xl space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Member Email or ID
            </label>
            <input
              type="text"
              name="userId"
              required
              placeholder="Enter user email or ID"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </form>
      )}

      {members.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">No members in this group</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {member.userId[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {member.user?.name || member.user?.email || member.userId}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {member.user?.email && member.user.name ? <span className="block mb-1">{member.user.email}</span> : null}
                    Joined {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'recently'}
                  </p>
                </div>
              </div>
              {(currentUserId === groupOwnerId || currentUserId === member.userId) && (
                <button
                  onClick={() => handleRemoveMember(member.userId, currentUserId === member.userId)}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive ml-2"
                  title={currentUserId === member.userId ? 'Leave Group' : 'Remove Member'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
