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

  const settlements = await db.settlement.findMany({
    where: {
      OR: [
        { from: userId },
        { to: userId }
      ],
      settled: false
    }
  })

  let youOwe = new Decimal(0)
  let youAreOwed = new Decimal(0)

  for (const s of settlements) {
    if (s.from === userId) {
      youOwe = youOwe.plus(new Decimal(s.amount.toString()))
    }
    if (s.to === userId) {
      youAreOwed = youAreOwed.plus(new Decimal(s.amount.toString()))
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
