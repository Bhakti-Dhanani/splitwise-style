'use server'

import { db as prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function addFriend(email: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    const currentUserId = session.user.id

    // Check if adding self
    if (session.user.email === email) {
      return { error: 'You cannot add yourself as a friend.' }
    }

    // Find the user by email
    const friend = await prisma.user.findUnique({
      where: { email },
    })

    if (!friend) {
      return { error: 'User not found. They need to sign up first.' }
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: currentUserId, userId2: friend.id },
          { userId1: friend.id, userId2: currentUserId },
        ],
      },
    })

    if (existingFriendship) {
      return { error: 'You are already friends with this user.' }
    }

    // Create the friendship (Order userId1 / userId2 deterministically to prevent dupes)
    const userId1 = currentUserId < friend.id ? currentUserId : friend.id
    const userId2 = currentUserId < friend.id ? friend.id : currentUserId

    await prisma.friendship.create({
      data: {
        userId1,
        userId2,
      },
    })

    revalidatePath('/friends')
    return { success: true }
  } catch (error) {
    console.error('Failed to add friend:', error)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function getFriends() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return []
  }

  const currentUserId = session.user.id

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userId1: currentUserId },
        { userId2: currentUserId },
      ],
    },
    include: {
      user1: true,
      user2: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  })

  // Format so it's a clean list of the *other* users
  const friends = friendships.map((f: any) => {
    return f.userId1 === currentUserId ? f.user2 : f.user1
  })

  return friends
}
