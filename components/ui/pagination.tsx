'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ totalPages, currentPage }: { totalPages: number, currentPage: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (pageNumber > 1) {
      params.set('page', pageNumber.toString())
    } else {
      params.delete('page')
    }
    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center space-x-4 mt-8">
      <Link
        href={createPageUrl(currentPage - 1)}
        className={`p-2 rounded-md border border-border hover:bg-muted transition-colors ${
          currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>
      <span className="text-sm font-medium text-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Link
        href={createPageUrl(currentPage + 1)}
        className={`p-2 rounded-md border border-border hover:bg-muted transition-colors ${
          currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </Link>
    </div>
  )
}
