'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Decimal from 'decimal.js'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getDashboardDataService(page = 1, limit = 10, search = '') {
  const userId = await getUserId()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { defaultCurrency: true }
  })
  const defaultCurrency = user?.defaultCurrency || 'USD'

  const settlements = await db.settlement.findMany({
    where: {
      OR: [
        { from: userId },
        { to: userId }
      ],
      settled: false
    }
  })

  // Fetch exchange rates for all unique currencies present in settlements
  const uniqueCurrencies = [...new Set(settlements.map((s: any) => s.currency || 'USD'))]
  const rates: Record<string, number> = {}
  
  for (const c of uniqueCurrencies) {
    if (c === defaultCurrency) {
      rates[c] = 1
    } else {
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${c}`, { next: { revalidate: 3600 } })
        const data = await res.json()
        rates[c] = data.rates[defaultCurrency] || 1
      } catch (err) {
        console.error(`Failed to fetch exchange rate for ${c}`, err)
        rates[c] = 1
      }
    }
  }

  let youOwe = new Decimal(0)
  let youAreOwed = new Decimal(0)

  for (const s of settlements) {
    const currency = (s as any).currency || 'USD'
    const rate = rates[currency]
    const convertedAmount = new Decimal(s.amount.toString()).times(rate)

    if (s.from === userId) {
      youOwe = youOwe.plus(convertedAmount)
    }
    if (s.to === userId) {
      youAreOwed = youAreOwed.plus(convertedAmount)
    }
  }

  const totalBalance = youAreOwed.minus(youOwe)

  const userGroups = await db.groupMember.findMany({
    where: { userId },
    select: { groupId: true }
  })

  const groupIds = userGroups.map(g => g.groupId)

  const totalActivities = await (db as any).activity.count({
    where: {
      AND: [
        {
          OR: [
            { groupId: { in: groupIds } },
            { userId: userId }
          ]
        },
        search ? {
          details: { contains: search, mode: 'insensitive' }
        } : {}
      ]
    }
  })

  const recentActivity = await (db as any).activity.findMany({
    where: {
      AND: [
        {
          OR: [
            { groupId: { in: groupIds } },
            { userId: userId }
          ]
        },
        search ? {
          details: { contains: search, mode: 'insensitive' }
        } : {}
      ]
    },
    include: {
      user: {
        select: { name: true, email: true, image: true }
      },
      group: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  })

  return {
    youOwe: youOwe.toNumber(),
    youAreOwed: youAreOwed.toNumber(),
    totalBalance: totalBalance.toNumber(),
    recentActivity,
    totalActivities
  }
}

export async function getDashboardChartsDataService(filter = 'this_month') {
  const userId = await getUserId()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { defaultCurrency: true }
  })
  const defaultCurrency = user?.defaultCurrency || 'USD'

  const now = new Date()
  let startDate = new Date(0)
  
  if (filter === 'last_7_days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (filter === 'last_30_days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (filter === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (filter === 'this_year') {
    startDate = new Date(now.getFullYear(), 0, 1)
  }

  const splits = await db.expenseSplit.findMany({
    where: {
      userId,
      expense: {
        date: { gte: startDate }
      }
    },
    include: {
      expense: true
    }
  })

  const uniqueCurrencies = [...new Set(splits.map(s => s.expense.currency || 'USD'))]
  const rates: Record<string, number> = {}
  
  for (const c of uniqueCurrencies) {
    if (c === defaultCurrency) {
      rates[c] = 1
    } else {
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${c}`, { next: { revalidate: 3600 } })
        const data = await res.json()
        rates[c] = data.rates[defaultCurrency] || 1
      } catch (err) {
        rates[c] = 1
      }
    }
  }

  const expensesByCategory: Record<string, number> = {}
  const expensesByDate: Record<string, number> = {}

  for (const split of splits) {
    const currency = split.expense.currency || 'USD'
    const rate = rates[currency]
    const amount = new Decimal(split.splitAmount.toString()).times(rate).toNumber()
    const category = split.expense.category || 'General'
    
    // Group by category
    expensesByCategory[category] = (expensesByCategory[category] || 0) + amount

    // Group by date
    const dateKey = new Date(split.expense.date).toISOString().split('T')[0]
    expensesByDate[dateKey] = (expensesByDate[dateKey] || 0) + amount
  }

  const ALL_CATEGORIES = [
    'General',
    'Food & Drink',
    'Groceries',
    'Transport',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Travel'
  ]

  const pieChartData = ALL_CATEGORIES.map(category => ({
    name: category,
    value: parseFloat((expensesByCategory[category] || 0).toFixed(2))
  }))

  const barChartData = Object.keys(expensesByDate).sort().map(date => ({
    date,
    amount: parseFloat(expensesByDate[date].toFixed(2))
  }))

  return { pieChartData, barChartData, defaultCurrency }
}
