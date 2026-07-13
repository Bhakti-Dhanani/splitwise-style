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

export async function getDashboardDataService(page = 1, limit = 10) {
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
      OR: [
        { groupId: { in: groupIds } },
        { userId: userId }
      ]
    }
  })

  const recentActivity = await (db as any).activity.findMany({
    where: {
      OR: [
        { groupId: { in: groupIds } },
        { userId: userId }
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
