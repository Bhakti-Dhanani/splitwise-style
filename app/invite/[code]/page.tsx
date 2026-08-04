import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import { getInviteDetailsService } from '@/services/invite.service'
import InviteAcceptCard from '@/components/invite-accept-card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Wallet, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function InviteLandingPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  const result = await getInviteDetailsService(code)

  const isLoggedIn = !!session?.user
  const currentUserId = session?.user?.id

  return (
    <main className="min-h-svh flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400/20 via-background to-background dark:from-sky-900/20 dark:via-background dark:to-background">
      {/* Background radial gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-50">
        <Link href="/" className="flex items-center gap-2 text-foreground font-semibold">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <span>Splitwise</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {result.error || !result.invitation ? (
          <div className="w-full bg-card/70 backdrop-blur-xl border border-border/60 rounded-3xl p-8 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Invalid Invite Link</h1>
            <p className="text-sm text-muted-foreground">
              {result.error || 'This invitation link is invalid or has expired.'}
            </p>
            <div className="pt-2">
              <Link href="/" className="inline-block w-full">
                <Button className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Return to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <InviteAcceptCard
            code={code}
            inviter={result.invitation.inviter}
            group={result.invitation.group}
            isLoggedIn={isLoggedIn}
            isInviter={currentUserId === result.invitation.inviter.id}
          />
        )}
      </div>
    </main>
  )
}
