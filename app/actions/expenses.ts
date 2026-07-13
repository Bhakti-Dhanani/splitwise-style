'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createExpenseSchema } from '@/lib/validators'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import Decimal from 'decimal.js'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createExpense(input: unknown) {
  const userId = await getUserId()
  const { groupId, description, amount, splits } = createExpenseSchema.parse(input)

  // Verify user is a member of the group
  const member = await db.groupMember.findFirst({
    where: { groupId, userId }
  })

  if (!member) throw new Error('Not a member of this group')

  // Validate splits sum to amount
  const splitsTotal = splits.reduce(
    (sum, split) => sum.plus(new Decimal(split.splitAmount)),
    new Decimal(0)
  )

  if (!splitsTotal.equals(new Decimal(amount))) {
    throw new Error('Splits must sum to the total amount')
  }

  // Create expense
  const expense = await db.expense.create({
    data: {
      groupId,
      paidBy: userId,
      description,
      amount: amount.toString(),
      splits: {
        create: splits.map(s => ({
          userId: s.userId,
          splitAmount: s.splitAmount.toString()
        }))
      }
    }
  })

  // Recalculate settlements
  await calculateSettlements(groupId)

  revalidatePath(`/groups/${groupId}`)
  return expense
}

export async function getExpensesByGroup(groupId: string) {
  await getUserId()

  return db.expense.findMany({
    where: { groupId }
  })
}

export async function getExpenseWithSplits(expenseId: string) {
  await getUserId()

  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    include: { splits: true }
  })

  if (!expense) throw new Error('Expense not found')

  return { expense, splits: expense.splits }
}

export async function deleteExpense(expenseId: string) {
  const userId = await getUserId()

  const expense = await db.expense.findUnique({
    where: { id: expenseId }
  })

  if (!expense) throw new Error('Expense not found')

  const { groupId } = expense

  await db.expense.delete({
    where: { id: expenseId }
  })

  // Recalculate settlements
  await calculateSettlements(groupId)

  revalidatePath(`/groups/${groupId}`)
}

async function calculateSettlements(groupId: string) {
  // Get all members
  const members = await db.groupMember.findMany({
    where: { groupId }
  })

  const userIds = members.map((m: { userId: string }) => m.userId)

  // Calculate who owes whom
  const balances: { [key: string]: Decimal } = {}

  // Initialize balances
  for (const userId of userIds) {
    balances[userId] = new Decimal(0)
  }

  // Calculate amounts paid
  const paidAmounts = await db.expense.groupBy({
    by: ['paidBy'],
    where: { groupId },
    _sum: { amount: true }
  })

  for (const { paidBy, _sum } of paidAmounts) {
    if (balances[paidBy] !== undefined && _sum.amount !== null) {
      balances[paidBy] = balances[paidBy].plus(new Decimal(_sum.amount.toString()))
    }
  }

  // Calculate amounts owed
  const groupExpenses = await db.expense.findMany({
    where: { groupId },
    select: { id: true }
  })
  
  const expenseIds = groupExpenses.map((e: { id: string }) => e.id)

  const owedAmounts = await db.expenseSplit.groupBy({
    by: ['userId'],
    where: { expenseId: { in: expenseIds } },
    _sum: { splitAmount: true }
  })

  for (const { userId, _sum } of owedAmounts) {
    if (balances[userId] !== undefined && _sum.splitAmount !== null) {
      balances[userId] = balances[userId].minus(new Decimal(_sum.splitAmount.toString()))
    }
  }

  // Clear existing settlements
  await db.settlement.deleteMany({
    where: { groupId }
  })

  // Create new settlements based on balances
  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance.lessThan(0))
    .sort((a, b) => a[1].comparedTo(b[1]))

  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance.greaterThan(0))
    .sort((a, b) => b[1].comparedTo(a[1]))

  let debtorIndex = 0
  let creditorIndex = 0
  let debtorRemaining = debtors[0]?.[1].negated() || new Decimal(0)
  let creditorRemaining = creditors[0]?.[1] || new Decimal(0)

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const [debtor] = debtors[debtorIndex]
    const [creditor] = creditors[creditorIndex]

    const settlement = Decimal.min(debtorRemaining, creditorRemaining)

    if (settlement.greaterThan(0)) {
      await db.settlement.create({
        data: {
          groupId,
          from: debtor,
          to: creditor,
          amount: settlement.toString(),
        }
      })
    }

    debtorRemaining = debtorRemaining.minus(settlement)
    creditorRemaining = creditorRemaining.minus(settlement)

    if (debtorRemaining.equals(0)) {
      debtorIndex++
      debtorRemaining = debtors[debtorIndex]?.[1].negated() || new Decimal(0)
    }

    if (creditorRemaining.equals(0)) {
      creditorIndex++
      creditorRemaining = creditors[creditorIndex]?.[1] || new Decimal(0)
    }
  }
}

export async function getGroupSettlements(groupId: string) {
  await getUserId()

  return db.settlement.findMany({
    where: { groupId }
  })
}

export async function markSettled(settlementId: string) {
  await getUserId()

  await db.settlement.update({
    where: { id: settlementId },
    data: {
      settled: true,
      settledAt: new Date(),
    }
  })

  revalidatePath(`/groups`)
}
