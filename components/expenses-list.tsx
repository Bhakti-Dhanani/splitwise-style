'use client'

import { useState, useMemo, useEffect } from 'react'
import { createExpenseService, deleteExpenseService, editExpenseService } from '@/services/expense.service'
import { Plus, Trash2, Loader2, Calculator, Edit2, CheckSquare, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Decimal from 'decimal.js'
import { Expense, Member, SplitMethod } from '@/types'

export default function ExpensesList({
  groupId,
  expenses,
  members,
  currentUserId,
  groupOwnerId,
  defaultCurrency,
}: {
  groupId: string
  expenses: Expense[]
  members: Member[]
  currentUserId: string
  groupOwnerId: string
  defaultCurrency: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

  // Form State
  const [description, setDescription] = useState('')
  const [originalAmount, setOriginalAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState('General')
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [currency, setCurrency] = useState(defaultCurrency)

  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [splitValues, setSplitValues] = useState<Record<string, string>>({})
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({})

  const router = useRouter()

  useEffect(() => {
    if (!showForm && !editingExpenseId) {
      const initial: Record<string, boolean> = {}
      members.forEach(m => initial[m.userId] = true)
      setSelectedMembers(initial)
    }
  }, [members, showForm, editingExpenseId])

  const amount = useMemo(() => {
    const val = parseFloat(originalAmount)
    if (isNaN(val)) return ''
    return val.toFixed(2)
  }, [originalAmount])

  // Auto-calculate splits based on method (using ORIGINAL amount)
  const calculatedSplits = useMemo(() => {
    const total = new Decimal(originalAmount || '0')
    const result: Record<string, Decimal> = {}

    if (total.isNaN() || total.lessThanOrEqualTo(0) || members.length === 0) {
      members.forEach(m => result[m.userId] = new Decimal(0))
      return result
    }

    const activeMembers = members.filter(m => selectedMembers[m.userId] !== false)

    if (splitMethod === 'equal') {
      if (activeMembers.length === 0) {
        members.forEach(m => result[m.userId] = new Decimal(0))
        return result
      }

      const splitAmount = total.dividedBy(activeMembers.length).toDecimalPlaces(2, Decimal.ROUND_DOWN)
      let sum = new Decimal(0)

      members.forEach(m => {
        if (selectedMembers[m.userId] !== false) {
          result[m.userId] = splitAmount
          sum = sum.plus(splitAmount)
        } else {
          result[m.userId] = new Decimal(0)
        }
      })

      // Add remainder to first active user
      const remainder = total.minus(sum)
      if (!remainder.isZero()) {
        result[activeMembers[0].userId] = result[activeMembers[0].userId].plus(remainder)
      }
    }
    else if (splitMethod === 'exact') {
      members.forEach(m => {
        if (selectedMembers[m.userId] !== false) {
          const val = new Decimal(splitValues[m.userId] || '0')
          result[m.userId] = val.isNaN() ? new Decimal(0) : val
        } else {
          result[m.userId] = new Decimal(0)
        }
      })
    }
    else if (splitMethod === 'percentage') {
      let sum = new Decimal(0)
      members.forEach(m => {
        if (selectedMembers[m.userId] !== false) {
          const pct = new Decimal(splitValues[m.userId] || '0')
          if (!pct.isNaN()) {
            const val = total.times(pct).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_DOWN)
            result[m.userId] = val
            sum = sum.plus(val)
          } else {
            result[m.userId] = new Decimal(0)
          }
        } else {
          result[m.userId] = new Decimal(0)
        }
      })

      const remainder = total.minus(sum)
      if (!remainder.isZero() && activeMembers.length > 0) {
        result[activeMembers[0].userId] = result[activeMembers[0].userId].plus(remainder)
      }
    }
    else if (splitMethod === 'shares') {
      const totalShares = activeMembers.reduce((acc, m) => {
        const s = new Decimal(splitValues[m.userId] || '0')
        return acc.plus(s.isNaN() ? 0 : s)
      }, new Decimal(0))

      if (totalShares.greaterThan(0)) {
        let sum = new Decimal(0)
        members.forEach(m => {
          if (selectedMembers[m.userId] !== false) {
            const s = new Decimal(splitValues[m.userId] || '0')
            if (!s.isNaN()) {
              const val = total.times(s).dividedBy(totalShares).toDecimalPlaces(2, Decimal.ROUND_DOWN)
              result[m.userId] = val
              sum = sum.plus(val)
            } else {
              result[m.userId] = new Decimal(0)
            }
          } else {
            result[m.userId] = new Decimal(0)
          }
        })
        const remainder = total.minus(sum)
        if (!remainder.isZero() && activeMembers.length > 0) {
          result[activeMembers[0].userId] = result[activeMembers[0].userId].plus(remainder)
        }
      } else {
        members.forEach(m => result[m.userId] = new Decimal(0))
      }
    }

    return result
  }, [originalAmount, splitMethod, splitValues, members, selectedMembers])

  const handleValueChange = (userId: string, val: string) => {
    setSplitValues(prev => ({ ...prev, [userId]: val }))
  }

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => ({ ...prev, [userId]: prev[userId] === false ? true : false }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const totalOriginal = parseFloat(originalAmount)

      if (isNaN(totalOriginal) || totalOriginal <= 0) throw new Error('Valid amount is required')

      if (splitMethod === 'exact') {
        const sum = Object.values(calculatedSplits).reduce((acc, val) => acc.plus(val), new Decimal(0))
        if (!sum.equals(new Decimal(totalOriginal))) {
          throw new Error(`Exact amounts must sum to ${totalOriginal}. Currently sums to ${sum.toNumber()}`)
        }
      }

      if (splitMethod === 'percentage') {
        const sumPct = members.filter(m => selectedMembers[m.userId] !== false).reduce((acc, m) => acc.plus(new Decimal(splitValues[m.userId] || '0')), new Decimal(0))
        if (!sumPct.equals(100)) {
          throw new Error(`Percentages must sum to 100%. Currently sums to ${sumPct.toNumber()}%`)
        }
      }

      // Convert calculated splits to default currency before saving to DB
      const activeMembersForSplits = members.filter(m => calculatedSplits[m.userId].toNumber() > 0)
      let sumOfSplits = 0

      const splits = activeMembersForSplits.map((m, index) => {
        const originalSplit = calculatedSplits[m.userId].toNumber()
        let convertedSplit = Number(originalSplit.toFixed(2))

        // Ensure the sum of splits exactly matches totalOriginal by adjusting the last split
        if (index === activeMembersForSplits.length - 1) {
          convertedSplit = Number((totalOriginal - sumOfSplits).toFixed(2))
        } else {
          sumOfSplits += convertedSplit
        }

        return {
          userId: m.userId,
          splitAmount: convertedSplit
        }
      })

      if (editingExpenseId) {
        await editExpenseService({
          id: editingExpenseId,
          description,
          amount: totalOriginal,
          date,
          category,
          currency,
          originalAmount: totalOriginal,
          paidBy,
          splits,
        })
      } else {
        await createExpenseService({
          groupId,
          description,
          amount: totalOriginal,
          date,
          category,
          currency,
          originalAmount: totalOriginal,
          paidBy,
          splits,
        })
      }

      setShowForm(false)
      setEditingExpenseId(null)
      setDescription('')
      setOriginalAmount('')
      setDate(new Date().toISOString().split('T')[0])
      setCategory('General')
      setPaidBy(currentUserId)
      setCurrency(defaultCurrency)
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
    setOriginalAmount(expense.originalAmount ? parseFloat(expense.originalAmount).toString() : parseFloat(expense.amount).toString())
    setCurrency(expense.currency || defaultCurrency)
    if (expense.date) setDate(new Date(expense.date).toISOString().split('T')[0])
    setCategory(expense.category || 'General')
    setPaidBy(expense.paidBy || currentUserId)

    setSplitMethod('exact')
    const vals: Record<string, string> = {}
    const selections: Record<string, boolean> = {}

    if (expense.splits) {
      // Re-calculate the original split values for exact mode
      // expense.splits contains the converted amounts, we need to divide by exchangeRate
      // Wait, we can fetch exchangeRate, but it might be different now than when expense was created!
      // Better to divide by (expense.amount / expense.originalAmount) if originalAmount exists
      let rate = 1
      if (expense.originalAmount && parseFloat(expense.originalAmount) > 0) {
        rate = parseFloat(expense.amount) / parseFloat(expense.originalAmount)
      }

      expense.splits.forEach((s: any) => {
        const originalSplit = parseFloat(s.splitAmount) / rate
        vals[s.userId] = originalSplit.toFixed(2)
        selections[s.userId] = originalSplit > 0
      })

      // if member not in splits (legacy), set to 0 and unselect
      members.forEach(m => {
        if (vals[m.userId] === undefined) {
          vals[m.userId] = '0'
          selections[m.userId] = false
        }
      })
    }

    setSelectedMembers(selections)
    setSplitValues(vals)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingExpenseId(null)
    setDescription('')
    setOriginalAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setCategory('General')
    setPaidBy(currentUserId)
    setCurrency(defaultCurrency)
    setSplitValues({})
    setSplitMethod('equal')

    const initial: Record<string, boolean> = {}
    members.forEach(m => initial[m.userId] = true)
    setSelectedMembers(initial)
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
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="AUD">AUD</option>
                  <option value="CAD">CAD</option>
                  <option value="JPY">JPY</option>
                </select>
                <input
                  type="number"
                  value={originalAmount}
                  onChange={e => setOriginalAmount(e.target.value)}
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="General">General</option>
                <option value="Dining">Dining</option>
                <option value="Groceries">Groceries</option>
                <option value="Transport">Transport</option>
                <option value="Utilities">Utilities</option>
                <option value="Entertainment">Entertainment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Paid By
              </label>
              <select
                value={paidBy}
                onChange={e => setPaidBy(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>
                    {m.user?.name || m.userId} {m.userId === currentUserId && '(You)'}
                  </option>
                ))}
              </select>
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
                <div key={member.userId} className={`flex items-center gap-3 ${selectedMembers[member.userId] === false ? 'opacity-50' : ''}`}>
                  <button
                    type="button"
                    onClick={() => toggleMemberSelection(member.userId)}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    {selectedMembers[member.userId] !== false ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
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

                  {splitMethod !== 'equal' && selectedMembers[member.userId] !== false && (
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
                          {splitMethod === 'percentage' ? '%' : splitMethod === 'shares' ? 'x' : currency}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="w-24 text-right shrink-0 font-medium text-sm text-foreground bg-background py-1.5 px-2 rounded-md border border-border/50 shadow-sm">
                    {currency} {calculatedSplits[member.userId]?.toNumber().toFixed(2) || '0.00'}
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
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-secondary text-secondary-foreground">
                    {(expense as any).category || 'General'}
                  </span>
                  <h3 className="font-medium text-foreground">{expense.description}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Paid by {members.find(m => m.userId === expense.paidBy)?.user?.name || expense.paidBy} on{' '}
                  {new Date((expense as any).date || expense.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right flex flex-col items-end">
                  <span className="text-lg font-bold text-primary">
                    {(expense as any).currency || defaultCurrency} {parseFloat((expense as any).originalAmount || expense.amount).toFixed(2)}
                  </span>
                </div>
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
