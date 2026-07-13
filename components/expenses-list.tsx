'use client'

import { useState, useMemo } from 'react'
import { createExpenseService, deleteExpenseService, editExpenseService } from '@/services/expense.service'
import { Plus, Trash2, Loader2, Calculator, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Decimal from 'decimal.js'
import { Expense, Member, SplitMethod } from '@/types'

export default function ExpensesList({
  groupId,
  expenses,
  members,
  currentUserId,
  groupOwnerId,
}: {
  groupId: string
  expenses: Expense[]
  members: Member[]
  currentUserId: string
  groupOwnerId: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  
  // Form State
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [splitValues, setSplitValues] = useState<Record<string, string>>({})
  
  const router = useRouter()

  // Auto-calculate splits based on method
  const calculatedSplits = useMemo(() => {
    const total = new Decimal(amount || '0')
    const result: Record<string, Decimal> = {}
    
    if (total.isNaN() || total.lessThanOrEqualTo(0) || members.length === 0) {
      members.forEach(m => result[m.userId] = new Decimal(0))
      return result
    }

    if (splitMethod === 'equal') {
      const splitAmount = total.dividedBy(members.length).toDecimalPlaces(2, Decimal.ROUND_DOWN)
      let sum = new Decimal(0)
      
      members.forEach(m => {
        result[m.userId] = splitAmount
        sum = sum.plus(splitAmount)
      })
      
      // Add remainder to first user
      const remainder = total.minus(sum)
      if (!remainder.isZero()) {
        result[members[0].userId] = result[members[0].userId].plus(remainder)
      }
    } 
    else if (splitMethod === 'exact') {
      members.forEach(m => {
        const val = new Decimal(splitValues[m.userId] || '0')
        result[m.userId] = val.isNaN() ? new Decimal(0) : val
      })
    }
    else if (splitMethod === 'percentage') {
      let sum = new Decimal(0)
      members.forEach(m => {
        const pct = new Decimal(splitValues[m.userId] || '0')
        if (!pct.isNaN()) {
          const val = total.times(pct).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_DOWN)
          result[m.userId] = val
          sum = sum.plus(val)
        } else {
          result[m.userId] = new Decimal(0)
        }
      })
      
      const remainder = total.minus(sum)
      if (!remainder.isZero() && members.length > 0) {
         result[members[0].userId] = result[members[0].userId].plus(remainder)
      }
    }
    else if (splitMethod === 'shares') {
      const totalShares = members.reduce((acc, m) => {
        const s = new Decimal(splitValues[m.userId] || '0')
        return acc.plus(s.isNaN() ? 0 : s)
      }, new Decimal(0))
      
      if (totalShares.greaterThan(0)) {
        let sum = new Decimal(0)
        members.forEach(m => {
          const s = new Decimal(splitValues[m.userId] || '0')
          if (!s.isNaN()) {
            const val = total.times(s).dividedBy(totalShares).toDecimalPlaces(2, Decimal.ROUND_DOWN)
            result[m.userId] = val
            sum = sum.plus(val)
          } else {
            result[m.userId] = new Decimal(0)
          }
        })
        const remainder = total.minus(sum)
        if (!remainder.isZero() && members.length > 0) {
           result[members[0].userId] = result[members[0].userId].plus(remainder)
        }
      } else {
        members.forEach(m => result[m.userId] = new Decimal(0))
      }
    }
    
    return result
  }, [amount, splitMethod, splitValues, members])

  const handleValueChange = (userId: string, val: string) => {
    setSplitValues(prev => ({ ...prev, [userId]: val }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const total = parseFloat(amount)
      if (isNaN(total) || total <= 0) throw new Error('Valid amount is required')
      
      if (splitMethod === 'exact') {
        const sum = Object.values(calculatedSplits).reduce((acc, val) => acc.plus(val), new Decimal(0))
        if (!sum.equals(new Decimal(total))) {
          throw new Error(`Exact amounts must sum to ${total}. Currently sums to ${sum.toNumber()}`)
        }
      }
      
      if (splitMethod === 'percentage') {
        const sumPct = members.reduce((acc, m) => acc.plus(new Decimal(splitValues[m.userId] || '0')), new Decimal(0))
        if (!sumPct.equals(100)) {
          throw new Error(`Percentages must sum to 100%. Currently sums to ${sumPct.toNumber()}%`)
        }
      }

      const splits = members.map(m => ({
        userId: m.userId,
        splitAmount: calculatedSplits[m.userId].toNumber()
      }))

      if (editingExpenseId) {
        await editExpenseService({
          id: editingExpenseId,
          description,
          amount: total,
          splits,
        })
      } else {
        await createExpenseService({
          groupId,
          description,
          amount: total,
          splits,
        })
      }
      
      setShowForm(false)
      setEditingExpenseId(null)
      setDescription('')
      setAmount('')
      setSplitValues({})
      setSplitMethod('equal')
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
      await deleteExpenseService(expenseId)
      router.refresh()
    } catch (err) {
      console.error('Failed to delete expense:', err)
    }
  }

  const handleEdit = (expense: any) => {
    setEditingExpenseId(expense.id)
    setDescription(expense.description)
    setAmount(parseFloat(expense.amount).toString())
    
    setSplitMethod('exact')
    const vals: Record<string, string> = {}
    if (expense.splits) {
      expense.splits.forEach((s: any) => {
        vals[s.userId] = parseFloat(s.splitAmount).toString()
      })
    }
    setSplitValues(vals)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingExpenseId(null)
    setDescription('')
    setAmount('')
    setSplitValues({})
    setSplitMethod('equal')
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
          onClick={() => {
            if (showForm) handleCancel()
            else setShowForm(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-card border border-border rounded-xl space-y-5 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                placeholder="e.g., Dinner, Groceries"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Total Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                <Calculator className="w-4 h-4 text-muted-foreground" />
                Split Method
              </label>
              <select 
                value={splitMethod} 
                onChange={(e) => setSplitMethod(e.target.value as SplitMethod)}
                className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="equal">Equally</option>
                <option value="exact">Exact Amounts</option>
                <option value="percentage">Percentages</option>
                <option value="shares">By Shares</option>
              </select>
            </div>

            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/50">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    {member.user?.image ? (
                       <img src={member.user.image} className="w-6 h-6 rounded-full" alt="" />
                    ) : (
                       <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
                         {member.user?.name?.[0] || 'U'}
                       </div>
                    )}
                    <span className="text-sm font-medium text-foreground truncate">
                      {member.user?.name || member.userId}
                    </span>
                  </div>
                  
                  {splitMethod !== 'equal' && (
                    <div className="w-24 shrink-0">
                      <div className="relative">
                        <input
                          type="number"
                          value={splitValues[member.userId] || ''}
                          onChange={(e) => handleValueChange(member.userId, e.target.value)}
                          step={splitMethod === 'shares' ? '1' : '0.01'}
                          min="0"
                          placeholder="0"
                          className="w-full pl-3 pr-6 py-1.5 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
                          {splitMethod === 'percentage' ? '%' : splitMethod === 'shares' ? 'x' : '$'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="w-20 text-right shrink-0 font-medium text-sm text-foreground bg-background py-1.5 px-2 rounded-md border border-border/50 shadow-sm">
                    ${calculatedSplits[member.userId]?.toNumber().toFixed(2) || '0.00'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingExpenseId ? 'Update Expense' : 'Save Expense'
              )}
            </button>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">No expenses yet</p>
        </div>
      ) : !showForm ? (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{expense.description}</h3>
                <p className="text-sm text-muted-foreground">
                  Paid by {members.find(m => m.userId === expense.paidBy)?.user?.name || expense.paidBy} on{' '}
                  {new Date(expense.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-primary">
                  ${parseFloat(expense.amount as string).toFixed(2)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${(expense as any).status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-amber-500/10 text-amber-600 dark:text-amber-500'}`}>
                  {(expense as any).status === 'PAID' ? 'Paid' : 'Pending'}
                </span>
                {(expense as any).status !== 'PAID' && (currentUserId === groupOwnerId || currentUserId === expense.paidBy) && (
                  <>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
