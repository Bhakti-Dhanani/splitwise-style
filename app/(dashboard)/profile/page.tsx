import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserProfileStatsService } from '@/services/user.service'
import { ProfileForm } from '@/components/profile-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Profile | Splitwise',
  description: 'Manage your profile details and profile picture.',
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const data = await getUserProfileStatsService()

  if (!data.user) {
    redirect('/sign-in')
  }

  const formattedUser = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    image: data.user.image,
    defaultCurrency: (data.user as any).defaultCurrency || 'USD',
    createdAt: data.user.createdAt,
  }

  return (
    <div className="space-y-6">
      <ProfileForm user={formattedUser} stats={data.stats} />
    </div>
  )
}
