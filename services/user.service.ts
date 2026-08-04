'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function updateDefaultCurrencyService(currency: string) {
  const userId = await getUserId()

  await (db.user as any).update({
    where: { id: userId },
    data: { defaultCurrency: currency }
  })

  return { success: true }
}

export async function updateUserProfileService(data: {
  name?: string
  image?: string | null
  defaultCurrency?: string
}) {
  const userId = await getUserId()

  const updateData: Record<string, any> = {}
  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.image !== undefined) updateData.image = data.image
  if (data.defaultCurrency !== undefined) updateData.defaultCurrency = data.defaultCurrency

  const updatedUser = await (db.user as any).update({
    where: { id: userId },
    data: updateData,
  })

  return { success: true, user: updatedUser }
}

export async function getUserProfileStatsService() {
  const userId = await getUserId()

  const [user, groupsCount, friendsCount, expensesCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
    }),
    db.groupMember.count({
      where: { userId },
    }),
    db.friendship.count({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
        status: 'ACCEPTED',
      },
    }),
    db.expense.count({
      where: { paidBy: userId },
    }),
  ])

  return {
    user,
    stats: {
      groupsCount,
      friendsCount,
      expensesCount,
    },
  }
}
