'use client'

import { useState } from 'react'
import { createExpense, deleteExpense } from '@/app/actions/expenses'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Expense {
  id: string
  description: string
  amount: string
  paidBy: string
  createdAt: Date
}

interface Member {
  id: string
  userId: string
}

export default function ExpensesList({
  groupId,
  expenses,
  members,
}: {
  groupId: string
  expenses: Expense[]
  members: Member[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const memberIds = members.map((m) => m.userId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)

    const splits = memberIds.map((userId) => {
      const splitAmount =
        parseFloat(formData.get(`split-${userId}`) as string) || 0
      return { userId, splitAmount }
    })

    try {
      await createExpense({
        groupId,
        description,
        amount,
        splits,
      })
      setShowForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      await deleteExpense(expenseId)
      router.refresh()
    } catch (err) {
      console.error('Failed to delete expense:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Expenses</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track all shared expenses in this group
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-card border border-border rounded-xl space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <input
              type="text"
              name="description"
              required
              placeholder="e.g., Dinner, Groceries"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Total Amount
            </label>
            <input
              type="number"
              name="amount"
              required
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Split between members
            </label>
            <div className="space-y-2">
              {memberIds.map((userId) => (
                <div key={userId} className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground flex-1">
                    {userId}
                  </label>
                  <input
                    type="number"
                    name={`split-${userId}`}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
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
                'Add Expense'
              )}
            </button>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">No expenses yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{expense.description}</h3>
                <p className="text-sm text-muted-foreground">
                  Paid by {expense.paidBy} on{' '}
                  {new Date(expense.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-primary">
                  ${parseFloat(expense.amount).toFixed(2)}
                </span>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
