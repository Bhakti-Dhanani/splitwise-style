'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createInviteService } from '@/services/invite.service'
import { Link2, Copy, Check, Loader2, Sparkles, Share2 } from 'lucide-react'

interface InviteDialogProps {
  children: React.ReactNode
  groupId?: string
  groupName?: string
}

export default function InviteDialog({ children, groupId, groupName }: InviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !inviteUrl) {
      generateLink()
    }
  }

  const generateLink = () => {
    setError(null)
    startTransition(async () => {
      const res = await createInviteService({ groupId })
      if (res.error) {
        setError(res.error)
      } else if (res.code) {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        setInviteUrl(`${origin}/invite/${res.code}`)
      }
    })
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="w-[92vw] max-w-[95vw] sm:max-w-[460px] bg-card/95 backdrop-blur-xl border border-border/60 shadow-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-6">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Share2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-foreground">
            {groupName ? `Invite to ${groupName}` : 'Invite a Friend'}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {groupName
              ? 'Share this unique link to invite friends to join this group.'
              : 'Share this link with a friend. Anyone with the link can connect with you.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {isPending ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating unique invite link...</p>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-center">
                {error}
              </div>
              <Button onClick={generateLink} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Invitation Link</span>
                  <span className="text-[11px] text-emerald-500 font-normal flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Valid for 7 days
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      readOnly
                      value={inviteUrl || ''}
                      className="pl-9 pr-3 font-mono text-xs bg-background/60 border-border select-all"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                  <Button
                    onClick={handleCopy}
                    className="shrink-0 gap-2 font-medium transition-all"
                    variant={copied ? 'default' : 'secondary'}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-border/40 text-xs text-muted-foreground leading-relaxed">
                💡 <span className="font-medium text-foreground">Tip:</span> When your friend opens this link, they’ll be prompted to log in or create an account, after which you’ll be automatically connected!
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
