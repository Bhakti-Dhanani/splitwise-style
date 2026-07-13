'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { logActivityService } from './activity.service'
import { ACTIVITY_ACTIONS } from '@/constants'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function addFriendService(email: string) {
  try {
    const currentUserId = await getUserId()

    const friend = await db.user.findUnique({
      where: { email },
    })

    if (!friend) {
      throw new Error('User not found')
    }

    if (friend.id === currentUserId) {
      throw new Error('You cannot add yourself as a friend')
    }

    const userId1 = currentUserId < friend.id ? currentUserId : friend.id
    const userId2 = currentUserId < friend.id ? friend.id : currentUserId

    const existingFriendship = await db.friendship.findUnique({
      where: {
        userId1_userId2: {
          userId1,
          userId2,
        },
      },
    })

    if (existingFriendship) {
      throw new Error('You are already friends with this user')
    }

    await db.friendship.create({
      data: {
        userId1,
        userId2,
      },
    })

    await logActivityService({
      userId: currentUserId,
      action: ACTIVITY_ACTIONS.FRIEND_ADDED,
      details: `Added ${friend.name || friend.email} as a friend`,
    })

    revalidatePath('/friends')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Something went wrong' }
  }
}

export async function getFriendsService(userId?: string) {
  const uid = userId || await getUserId()
  const friendships = await db.friendship.findMany({
    where: {
      OR: [
        { userId1: uid },
        { userId2: uid },
      ],
    },
    include: {
      user1: {
        select: { id: true, name: true, email: true, image: true },
      },
      user2: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  })

  return friendships.map((f) => 
    f.userId1 === uid ? f.user2 : f.user1
  )
}
