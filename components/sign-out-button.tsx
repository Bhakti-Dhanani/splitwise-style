'use client'

import { LogOut } from 'lucide-react'
import Link from 'next/link'

export function SignOutButton() {
  return (
    <Link
      href="/sign-out"
      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive flex items-center justify-center"
      title="Sign Out"
    >
      <LogOut className="w-5 h-5" />
    </Link>
  )
}
