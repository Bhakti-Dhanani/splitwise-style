'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Loader2 } from 'lucide-react'

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    const performSignOut = async () => {
      await authClient.signOut()
      window.location.href = '/sign-in'
    }
    
    performSignOut()
  }, [router])

  return (
    <main className="min-h-svh bg-background flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Signing you out safely...</p>
      </div>
    </main>
  )
}
