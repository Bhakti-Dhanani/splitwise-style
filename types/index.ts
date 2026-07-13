import { Group as PrismaGroup, User as PrismaUser, GroupMember as PrismaGroupMember, Expense as PrismaExpense, Settlement as PrismaSettlement, Activity as PrismaActivity } from '@prisma/client'

export interface User {
  id?: string
  name: string
  email?: string
  image: string | null
}

export interface Member {
  id: string
  userId: string
  user?: User
  groupId?: string
  createdAt?: Date
}

export interface Group {
  id: string
  name: string
  description: string | null
  createdAt?: Date
  updatedAt?: Date
  userId?: string
}

export interface Expense {
  id: string
  description: string
  amount: any
  paidBy: string
  createdAt: Date
  groupId?: string
}

export interface Settlement {
  id: string
  amount: any
  from: string
  to: string
  settled: boolean | null
  settledAt: Date | null
  groupId?: string
  userFrom?: User
  userTo?: User
}

export type SplitMethod = 'equal' | 'exact' | 'percentage' | 'shares'

export interface Activity {
  id: string
  userId: string
  groupId: string | null
  action: string
  details: string
  createdAt: Date
  user: User
  group?: Group | null
}
