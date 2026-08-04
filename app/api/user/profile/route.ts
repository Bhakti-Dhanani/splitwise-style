import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, image, defaultCurrency } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = String(name).trim()
    if (image !== undefined) updateData.image = image
    if (defaultCurrency !== undefined) updateData.defaultCurrency = String(defaultCurrency)

    const updatedUser = await (db.user as any).update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
