'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { acceptInviteService } from '@/services/invite.service'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, Loader2, CheckCircle2, ArrowRight, Wallet, Sparkles } from 'lucide-react'

interface InviterInfo {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface GroupInfo {
  id: string
  name: string
  description: string | null
}

interface InviteAcceptCardProps {
  code: string
  inviter: InviterInfo
  group: GroupInfo | null
  isLoggedIn: boolean
  isInviter: boolean
}

export default function InviteAcceptCard({
  code,
  inviter,
  group,
  isLoggedIn,
  isInviter,
}: InviteAcceptCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string>('/friends')

  const handleAccept = () => {
    setError(null)
    startTransition(async () => {
      const res = await acceptInviteService(code)
      if (res.error) {
        setError(res.error)
      } else {
        setAccepted(true)
        const targetPath = res.groupId ? `/groups/${res.groupId}` : '/friends'
        setRedirectPath(targetPath)
      }
    })
  }

  const callbackUrl = encodeURIComponent(`/invite/${code}`)

  return (
    <div className="w-full max-w-md bg-card/70 backdrop-blur-xl border border-border/60 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
        <Sparkles className="w-3.5 h-3.5" />
        <span>{group ? 'Group Invitation' : 'Friend Invitation'}</span>
      </div>

      {/* Inviter & Group Avatar Header */}
      <div className="space-y-4">
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 ring-4 ring-primary/20 shadow-md flex items-center justify-center">
            {inviter.image ? (
              <img src={inviter.image} alt={inviter.name || inviter.email} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">
                {inviter.name?.[0]?.toUpperCase() || inviter.email[0]?.toUpperCase()}
              </span>
            )}
          </div>
          {group && (
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full ring-2 ring-background shadow-lg">
              <Users className="w-4 h-4" />
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {inviter.name || inviter.email}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            invited you to {group ? <span className="font-semibold text-foreground">"{group.name}"</span> : 'connect on Splitwise'}
          </p>
          {group?.description && (
            <p className="text-xs text-muted-foreground/80 italic mt-2 bg-muted/30 p-2 rounded-lg border border-border/30">
              "{group.description}"
            </p>
          )}
        </div>
      </div>

      {/* Action States */}
      {accepted ? (
        <div className="space-y-4 pt-2 animate-in fade-in zoom-in duration-300">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-500" />
            <p className="font-semibold text-base">Invitation Accepted!</p>
            <p className="text-xs opacity-90">
              {group
                ? `You've joined ${group.name} and connected with ${inviter.name || 'your friend'}.`
                : `You are now friends with ${inviter.name || 'your friend'}.`}
            </p>
          </div>
          <Button
            onClick={() => router.push(redirectPath)}
            className="w-full h-11 text-base font-medium gap-2 shadow-lg shadow-primary/20"
          >
            <span>Continue to {group ? 'Group' : 'Friends'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : isInviter ? (
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-muted/60 border border-border rounded-xl text-xs text-muted-foreground">
            This is your own invitation link. Send it to a friend to invite them!
          </div>
          <Link href="/dashboard" className="block w-full">
            <Button variant="outline" className="w-full">Go to Dashboard</Button>
          </Link>
        </div>
      ) : !isLoggedIn ? (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground mb-1">
            Sign in or create an account to accept this invitation.
          </p>
          <Link href={`/sign-up?callbackUrl=${callbackUrl}`} className="block w-full">
            <Button className="w-full h-11 text-base font-medium shadow-md">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account to Join
            </Button>
          </Link>
          <Link href={`/sign-in?callbackUrl=${callbackUrl}`} className="block w-full">
            <Button variant="outline" className="w-full h-11 text-base font-medium">
              Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
              {error}
            </div>
          )}
          <Button
            onClick={handleAccept}
            disabled={isPending}
            className="w-full h-11 text-base font-medium gap-2 shadow-lg shadow-primary/20"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Accepting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Invitation</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
