'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import Decimal from 'decimal.js'
import { logActivityService } from './activity.service'
import { createExpenseSchema, updateExpenseSchema } from '@/lib/validators'
import { ACTIVITY_ACTIONS } from '@/constants'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createExpenseService(input: unknown) {
  const userId = await getUserId()
  const { groupId, description, amount, date, category, currency, originalAmount, paidBy, splits } = createExpenseSchema.parse(input)

  const member = await db.groupMember.findFirst({
    where: { groupId, userId }
  })

  if (!member) throw new Error('Not a member of this group')

  const splitsTotal = splits.reduce(
    (sum, split) => sum.plus(new Decimal(split.splitAmount)),
    new Decimal(0)
  )

  if (!splitsTotal.equals(new Decimal(amount))) {
    throw new Error('Splits must sum to the total amount')
  }

  const expense = await (db.expense as any).create({
    data: {
      groupId,
      paidBy: paidBy || userId,
      description,
      amount: amount.toString(),
      date: date ? new Date(date) : undefined,
      category: category || 'General',
      currency: currency || 'USD',
      originalAmount: originalAmount ? originalAmount.toString() : undefined,
      splits: {
        create: splits.map((s: any) => ({
          userId: s.userId,
          splitAmount: s.splitAmount.toString()
        }))
      }
    }
  })

  await calculateSettlementsService(groupId)

  await logActivityService({
    userId,
    groupId,
    action: ACTIVITY_ACTIONS.EXPENSE_ADDED,
    details: `Added expense "${description}" for ${currency || 'USD'} ${originalAmount ? originalAmount.toString() : amount.toString()}`,
  })

  revalidatePath(`/groups/${groupId}`)
  return { success: true, id: expense.id }
}

export async function editExpenseService(input: unknown) {
  try {
    const userId = await getUserId()
    const { id, description, amount, date, category, currency, originalAmount, paidBy, splits } = updateExpenseSchema.parse(input)

    const existingExpense = await db.expense.findUnique({
      where: { id },
      include: { group: true }
    })

    if (!existingExpense) throw new Error('Expense not found')

    const member = await db.groupMember.findFirst({
      where: { groupId: existingExpense.groupId, userId }
    })

    if (!member) throw new Error('Not a member of this group')

    if ((existingExpense as any).status === 'PAID') {
      throw new Error('Cannot edit a paid expense')
    }

    if (existingExpense.paidBy !== userId && existingExpense.group.userId !== userId) {
      throw new Error('Only the expense creator or group owner can edit this expense')
    }

    if (amount !== undefined && splits) {
      const splitsTotal = splits.reduce(
        (sum, split) => sum.plus(new Decimal(split.splitAmount)),
        new Decimal(0)
      )

      if (!splitsTotal.equals(new Decimal(amount))) {
        throw new Error(`Splits must sum to the total amount. Splits: ${splitsTotal}, Amount: ${amount}`)
      }
    }

    const updateData: any = {}
    if (description !== undefined) updateData.description = description
    if (amount !== undefined) updateData.amount = amount.toString()
    if (date !== undefined) updateData.date = new Date(date)
    if (category !== undefined) updateData.category = category
    if (currency !== undefined) updateData.currency = currency
    if (originalAmount !== undefined) updateData.originalAmount = originalAmount.toString()
    if (paidBy !== undefined) updateData.paidBy = paidBy

    if (splits) {
      updateData.splits = {
        deleteMany: {},
        create: splits.map(s => ({
          userId: s.userId,
          splitAmount: s.splitAmount.toString()
        }))
      }
    }

    const expense = await (db.expense as any).update({
      where: { id },
      data: updateData
    })

    await calculateSettlementsService(existingExpense.groupId)

    await logActivityService({
      userId,
      groupId: existingExpense.groupId,
      action: ACTIVITY_ACTIONS.EXPENSE_ADDED,
      details: `Updated expense "${expense.description}"`,
    })

    revalidatePath(`/groups/${existingExpense.groupId}`)
    return { success: true, id: expense.id }
  } catch (error) {
    console.error("EDIT EXPENSE ERROR:", error)
    throw error
  }
}

export async function getExpensesByGroupService(groupId: string) {
  await getUserId()
  return db.expense.findMany({
    where: { groupId },
    include: { splits: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getExpenseWithSplitsService(expenseId: string) {
  await getUserId()
  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    include: { splits: true }
  })

  if (!expense) throw new Error('Expense not found')

  return { expense, splits: expense.splits }
}

export async function deleteExpenseService(expenseId: string) {
  const userId = await getUserId()

  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    include: { group: true }
  })

  if (!expense) throw new Error('Expense not found')

  if ((expense as any).status === 'PAID') {
    throw new Error('Cannot delete a paid expense')
  }

  if (expense.paidBy !== userId && expense.group.userId !== userId) {
    throw new Error('Only the expense creator or group owner can delete this expense')
  }

  const { groupId } = expense

  await db.expense.delete({
    where: { id: expenseId }
  })

  await calculateSettlementsService(groupId)

  await logActivityService({
    userId,
    groupId: expense.groupId,
    action: ACTIVITY_ACTIONS.EXPENSE_DELETED,
    details: `Deleted expense "${expense.description}"`,
  })

  revalidatePath(`/groups/${expense.groupId}`)
}

export async function calculateSettlementsService(groupId: string) {
  const members = await db.groupMember.findMany({
    where: { groupId }
  })

  const userIds = members.map((m: { userId: string }) => m.userId)

  const expenses = await db.expense.findMany({
    where: { groupId, status: 'PENDING' },
    include: { splits: true }
  })

  const currencies = [...new Set(expenses.map((e: any) => e.currency))]

  await db.settlement.deleteMany({
    where: { groupId }
  })

  for (const currency of currencies) {
    const currencyExpenses = expenses.filter((e: any) => e.currency === currency)

    const balances: { [key: string]: Decimal } = {}
    for (const userId of userIds) {
      balances[userId] = new Decimal(0)
    }

    for (const expense of currencyExpenses) {
      balances[expense.paidBy] = balances[expense.paidBy].plus(new Decimal(expense.amount.toString()))

      for (const split of expense.splits) {
        balances[split.userId] = balances[split.userId].minus(new Decimal(split.splitAmount.toString()))
      }
    }

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
            currency: currency,
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
}

export async function getGroupSettlementsService(groupId: string) {
  await getUserId()
  return db.settlement.findMany({
    where: { groupId },
    include: {
      userFrom: { select: { id: true, name: true, email: true, image: true } },
      userTo: { select: { id: true, name: true, email: true, image: true } }
    }
  })
}

export async function markSettledService(settlementId: string) {
  const userId = await getUserId()

  const settlement = await db.settlement.update({
    where: { id: settlementId },
    data: {
      settled: true,
      settledAt: new Date(),
    }
  })
  
  const result = await db.settlement.findUnique({
    where: { id: settlementId },
    include: { userTo: true }
  })

  const user = await db.user.findUnique({ where: { id: userId } })
  const currency = (user as any)?.defaultCurrency || 'USD'

  if (result) {
    const expensesToUpdate = await (db.expense as any).findMany({
      where: {
        groupId: result.groupId,
        status: 'PENDING',
        OR: [
          { paidBy: result.to, splits: { some: { userId: result.from } } },
          { paidBy: result.from, splits: { some: { userId: result.to } } }
        ]
      }
    })

    if (expensesToUpdate.length > 0) {
      await (db.expense as any).updateMany({
        where: { id: { in: expensesToUpdate.map((e: any) => e.id) } },
        data: { status: 'PAID' }
      })
    }

    await logActivityService({
      userId,
      groupId: result.groupId,
      action: ACTIVITY_ACTIONS.SETTLEMENT_COMPLETED,
      details: `Settled a debt of ${currency} ${result.amount} to ${result.userTo?.name || 'user'}`,
    })
  }

  revalidatePath(`/groups/${result?.groupId || ''}`)
  revalidatePath(`/dashboard`)
  revalidatePath(`/activity`)
}
