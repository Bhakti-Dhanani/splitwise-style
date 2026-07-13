'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function logActivityService({
  userId,
  groupId,
  action,
  details,
}: {
  userId: string
  groupId?: string
  action: string
  details: string
}) {
  return (db as any).activity.create({
    data: {
      userId,
      groupId: groupId ?? null,
      action,
      details,
    },
  })
}

export async function getRecentActivityService(userId?: string, page = 1, limit = 10) {
  let uid = userId
  if (!uid) {
    try {
      uid = await getUserId()
    } catch {
      return { activities: [], totalActivities: 0 }
    }
  }

  const userGroups = await db.groupMember.findMany({
    where: { userId: uid },
    select: { groupId: true }
  })
  const groupIds = userGroups.map((g: { groupId: string }) => g.groupId)

  const totalActivities = await (db as any).activity.count({
    where: {
      OR: [
        { groupId: { in: groupIds } },
        { userId: uid }
      ]
    }
  })

  const activities = await (db as any).activity.findMany({
    where: {
      OR: [
        { groupId: { in: groupIds } },
        { userId: uid }
      ]
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      group: {
        select: { id: true, name: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * limit,
    take: limit,
  })

  return { activities, totalActivities }
}
