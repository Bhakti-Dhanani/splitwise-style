'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { logActivityService } from './activity.service'
import { createGroupSchema, addMemberSchema } from '@/lib/validators'
import { ACTIVITY_ACTIONS } from '@/constants'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createGroupService(input: unknown) {
  const userId = await getUserId()
  const { name, description } = createGroupSchema.parse(input)

  const group = await db.group.create({
    data: {
      userId,
      name,
      description,
      members: {
        create: {
          userId,
        }
      }
    }
  })

  await logActivityService({
    userId,
    groupId: group.id,
    action: ACTIVITY_ACTIONS.GROUP_CREATED,
    details: `Created group "${name}"`,
  })

  revalidatePath('/groups')
  return group
}

export async function getGroupsService(userId?: string) {
  const uid = userId || await getUserId()
  return db.group.findMany({
    where: {
      members: {
        some: {
          userId: uid
        }
      }
    }
  })
}

export async function getGroupByIdService(groupId: string, userId?: string) {
  const uid = userId || await getUserId()
  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId: uid
        }
      }
    }
  })
  if (!group) throw new Error('Group not found')
  return group
}

export async function getGroupMembersService(groupId: string) {
  return db.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: { name: true, email: true, image: true }
      }
    }
  })
}

export async function addMemberToGroupService(input: unknown) {
  const ownerId = await getUserId()
  const { groupId, userId: newUserId } = addMemberSchema.parse(input)

  const group = await db.group.findFirst({
    where: { id: groupId, userId: ownerId }
  })

  if (!group) throw new Error('Group not found')

  const userToAdd = await db.user.findFirst({
    where: {
      OR: [
        { id: newUserId },
        { email: newUserId }
      ]
    }
  })

  if (!userToAdd) throw new Error('User not found')
  const resolvedUserId = userToAdd.id

  const existing = await db.groupMember.findFirst({
    where: { groupId, userId: resolvedUserId }
  })

  if (existing) throw new Error('Member already in group')

  const result = await db.groupMember.create({
    data: {
      groupId,
      userId: resolvedUserId,
    }
  })

  await logActivityService({
    userId: ownerId,
    groupId,
    action: ACTIVITY_ACTIONS.MEMBER_ADDED,
    details: `Added user ${userToAdd.name || userToAdd.email} to group`,
  })

  revalidatePath(`/groups/${groupId}`)
  return result
}

export async function removeMemberFromGroupService(groupId: string, memberId: string) {
  const ownerId = await getUserId()

  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId: ownerId
        }
      }
    }
  })

  if (!group) throw new Error('Group not found')

  if (group.userId !== ownerId && ownerId !== memberId) {
    throw new Error('Only the group owner can remove members')
  }

  await db.groupMember.deleteMany({
    where: { groupId, userId: memberId }
  })

  await logActivityService({
    userId: ownerId,
    groupId,
    action: ACTIVITY_ACTIONS.MEMBER_REMOVED,
    details: `Removed user ${memberId} from group`,
  })

  revalidatePath(`/groups/${groupId}`)
}

export async function deleteGroupService(groupId: string) {
  const ownerId = await getUserId()

  const group = await db.group.findFirst({
    where: { id: groupId, userId: ownerId }
  })

  if (!group) throw new Error('Group not found')

  await db.group.delete({
    where: { id: groupId }
  })

  revalidatePath('/groups')
}
