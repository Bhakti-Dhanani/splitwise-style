import { z } from 'zod'

// Group validators
export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().max(500).optional(),
})

export const updateGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

export const deleteGroupSchema = z.object({
  id: z.string().uuid(),
})

// Group member validators
export const addMemberSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().min(1),
})

export const removeMemberSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().min(1),
})

// Expense validators
export const createExpenseSchema = z.object({
  groupId: z.string().uuid(),
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().optional(),
  category: z.string().optional(),
  currency: z.string().optional(),
  originalAmount: z.number().positive().optional(),
  paidBy: z.string().optional(),
  splits: z.array(
    z.object({
      userId: z.string().min(1),
      splitAmount: z.number().nonnegative(),
    })
  ).min(1, 'At least one split is required'),
})

export const updateExpenseSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  category: z.string().optional(),
  currency: z.string().optional(),
  originalAmount: z.number().positive().optional(),
  paidBy: z.string().optional(),
  splits: z.array(
    z.object({
      userId: z.string().min(1),
      splitAmount: z.number().nonnegative(),
    })
  ).optional(),
})

export const deleteExpenseSchema = z.object({
  id: z.string().uuid(),
})

// Settlement validators
export const markSettledSchema = z.object({
  settlementId: z.string().uuid(),
})

export const settleMultipleSchema = z.object({
  settlementIds: z.array(z.string().uuid()).min(1),
})

// Types for exports
export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type AddMemberInput = z.infer<typeof addMemberSchema>
