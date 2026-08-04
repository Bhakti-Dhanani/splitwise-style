import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { SettingsForm } from '@/components/settings-form'
import Link from 'next/link'
import { User, ArrowRight, Camera } from 'lucide-react'

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account preferences and defaults.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profile Link Card */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-foreground">Profile Overview</h3>
              <p className="text-sm text-muted-foreground">Manage your personal info and profile picture.</p>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span>Edit Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border-2 border-border">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <h4 className="text-lg font-semibold text-foreground">{user.name}</h4>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-primary font-medium mt-1">
                Customize your name, profile photo avatar, and currency preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Currency / Preferences Card */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Preferences</h3>
            <p className="text-sm text-muted-foreground">Customize your default currency.</p>
          </div>
          <div className="p-6 space-y-4">
            <SettingsForm initialCurrency={(user as any).defaultCurrency} />
          </div>
        </div>
      </div>
    </div>
  )
}
