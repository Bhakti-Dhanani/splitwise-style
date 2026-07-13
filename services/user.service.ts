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
