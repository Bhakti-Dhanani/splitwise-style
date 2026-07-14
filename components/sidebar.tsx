'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Activity, 
  Settings,
  LogOut,
  Wallet,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Groups', href: '/groups', icon: Users },
  { name: 'Friends', href: '/friends', icon: UserPlus },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      {/* Mobile Menu Toggle Button (Visible only on mobile) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden fixed top-3 left-6 z-40 p-2 rounded-lg bg-card border border-border shadow-sm text-foreground hover:bg-muted transition-colors"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-card transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Splitwise</span>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button 
            className="md:hidden p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">
                {user?.name || 'User'}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
