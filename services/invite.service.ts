'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { logActivityService } from './activity.service'
import { ACTIVITY_ACTIONS } from '@/constants'
import crypto from 'crypto'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createInviteService(params?: { groupId?: string }) {
  try {
    const currentUserId = await getUserId()

    // If groupId is provided, verify user is a member of that group
    if (params?.groupId) {
      const membership = await db.groupMember.findFirst({
        where: {
          groupId: params.groupId,
          userId: currentUserId,
        },
      })
      if (!membership) {
        throw new Error('You are not a member of this group')
      }
    }

    const code = crypto.randomBytes(8).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invitation = await db.invitation.create({
      data: {
        code,
        inviterId: currentUserId,
        groupId: params?.groupId || null,
        expiresAt,
      },
    })

    return { success: true, code: invitation.code }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create invite link' }
  }
}

export async function getInviteDetailsService(code: string) {
  try {
    const invitation = await db.invitation.findUnique({
      where: { code },
      include: {
        inviter: {
          select: { id: true, name: true, email: true, image: true },
        },
        group: {
          select: { id: true, name: true, description: true },
        },
      },
    })

    if (!invitation) {
      return { error: 'Invitation link not found or invalid' }
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return { error: 'Invitation link has expired' }
    }

    return {
      success: true,
      invitation: {
        code: invitation.code,
        inviter: invitation.inviter,
        group: invitation.group,
        createdAt: invitation.createdAt,
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to fetch invitation details' }
  }
}

export async function acceptInviteService(code: string) {
  try {
    const currentUserId = await getUserId()

    const invitation = await db.invitation.findUnique({
      where: { code },
      include: {
        inviter: true,
        group: true,
      },
    })

    if (!invitation) {
      throw new Error('Invitation link not found or invalid')
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new Error('Invitation link has expired')
    }

    if (invitation.inviterId === currentUserId) {
      throw new Error('You cannot accept your own invitation link')
    }

    // 1. Establish friendship if not already friends
    const userId1 = currentUserId < invitation.inviterId ? currentUserId : invitation.inviterId
    const userId2 = currentUserId < invitation.inviterId ? invitation.inviterId : currentUserId

    const existingFriendship = await db.friendship.findUnique({
      where: {
        userId1_userId2: {
          userId1,
          userId2,
        },
      },
    })

    if (!existingFriendship) {
      await db.friendship.create({
        data: {
          userId1,
          userId2,
        },
      })

      await logActivityService({
        userId: currentUserId,
        action: ACTIVITY_ACTIONS.FRIEND_ADDED,
        details: `Connected with ${invitation.inviter.name || invitation.inviter.email} via invite link`,
      })
    }

    // 2. Add to group if group invite
    let joinedGroup = false
    if (invitation.groupId) {
      const existingMember = await db.groupMember.findFirst({
        where: {
          groupId: invitation.groupId,
          userId: currentUserId,
        },
      })

      if (!existingMember) {
        await db.groupMember.create({
          data: {
            groupId: invitation.groupId,
            userId: currentUserId,
          },
        })

        await logActivityService({
          userId: currentUserId,
          groupId: invitation.groupId,
          action: 'MEMBER_ADDED',
          details: `Joined group "${invitation.group?.name || 'Group'}" via invite link`,
        })

        joinedGroup = true
      }
    }

    revalidatePath('/friends')
    revalidatePath('/groups')
    if (invitation.groupId) {
      revalidatePath(`/groups/${invitation.groupId}`)
    }

    return {
      success: true,
      groupId: invitation.groupId,
      alreadyConnected: !!existingFriendship && (!invitation.groupId || !joinedGroup),
    }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to accept invitation' }
  }
}
