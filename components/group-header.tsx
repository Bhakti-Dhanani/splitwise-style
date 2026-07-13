'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteGroup } from '@/app/actions/groups'
import { ArrowLeft, Trash2, AlertCircle } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string | null
}

export default function GroupHeader({ group }: { group: Group }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteGroup(group.id)
      router.push('/groups')
    } catch (error) {
      console.error('Failed to delete group:', error)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/groups"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {group.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Delete Group?</h2>
              </div>

              <p className="text-muted-foreground mb-6">
                This will delete the group and all its expenses. This action cannot be
                undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
