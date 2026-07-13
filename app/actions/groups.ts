'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createGroupSchema, addMemberSchema } from '@/lib/validators'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createGroup(input: unknown) {
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

  revalidatePath('/groups')
  return group
}

export async function getGroups() {
  const userId = await getUserId()

  return db.group.findMany({
    where: { userId }
  })
}

export async function getGroupById(groupId: string) {
  const userId = await getUserId()

  const group = await db.group.findFirst({
    where: { id: groupId, userId }
  })

  if (!group) throw new Error('Group not found')
  return group
}

export async function getGroupMembers(groupId: string) {
  await getUserId()

  return db.groupMember.findMany({
    where: { groupId }
  })
}

export async function addMemberToGroup(input: unknown) {
  const userId = await getUserId()
  const { groupId, userId: newUserId } = addMemberSchema.parse(input)

  const group = await db.group.findFirst({
    where: { id: groupId, userId }
  })

  if (!group) throw new Error('Group not found')

  const existing = await db.groupMember.findFirst({
    where: { groupId, userId: newUserId }
  })

  if (existing) throw new Error('Member already in group')

  const result = await db.groupMember.create({
    data: {
      groupId,
      userId: newUserId,
    }
  })

  revalidatePath(`/groups/${groupId}`)
  return result
}

export async function removeMemberFromGroup(
  groupId: string,
  memberId: string
) {
  const userId = await getUserId()

  const group = await db.group.findFirst({
    where: { id: groupId, userId }
  })

  if (!group) throw new Error('Group not found')

  await db.groupMember.deleteMany({
    where: { groupId, userId: memberId }
  })

  revalidatePath(`/groups/${groupId}`)
}

export async function deleteGroup(groupId: string) {
  const userId = await getUserId()

  const group = await db.group.findFirst({
    where: { id: groupId, userId }
  })

  if (!group) throw new Error('Group not found')

  // Delete related data (handled by Prisma Cascade)
  await db.group.delete({
    where: { id: groupId }
  })

  revalidatePath('/groups')
}
