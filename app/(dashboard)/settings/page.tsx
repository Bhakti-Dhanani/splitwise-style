import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { SettingsForm } from '@/components/settings-form'

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
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Profile</h3>
            <p className="text-sm text-muted-foreground">Update your personal information.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <input 
                type="text" 
                defaultValue={session.user.name || ''} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm max-w-md pointer-events-none opacity-50" 
                disabled 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <input 
                type="email" 
                defaultValue={session.user.email} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm max-w-md pointer-events-none opacity-50" 
                disabled 
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Profile updates will be available in a future release.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Preferences</h3>
            <p className="text-sm text-muted-foreground">Customize your Splitwise experience.</p>
          </div>
          <div className="p-6 space-y-4">
            <SettingsForm initialCurrency={(user as any).defaultCurrency} />
          </div>
        </div>
      </div>
    </div>
  )
}
