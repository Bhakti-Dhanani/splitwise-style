'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Users, ArrowRight, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Group } from '@/types'

export default function GroupsList({ groups }: { groups: Group[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups
    return groups.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [groups, searchQuery])

  // Pagination logic
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage)
  
  const currentGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredGroups.slice(start, start + itemsPerPage)
  }, [filteredGroups, currentPage, itemsPerPage])

  // Reset to first page when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Search Bar Toolbar */}
      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search groups by name or description..."
          className="w-full pl-10 md:pl-12 pr-4 py-3 bg-card/40 backdrop-blur-md border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground shadow-sm transition-all"
        />
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-center py-12 md:py-16 bg-card/20 backdrop-blur-sm border border-border/50 rounded-2xl shadow-inner">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5 mb-4">
            <Search className="h-6 w-6 text-primary/60" />
          </div>
          <p className="text-muted-foreground font-medium text-lg">No groups match your search.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Try using different keywords.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {currentGroups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <div className="group relative h-full bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer">
                  {/* Subtle Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="relative p-5 md:p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-5 md:mb-6">
                      <div className="flex-1 pr-4">
                        <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
                          {group.name}
                        </h3>
                        {group.description ? (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                            {group.description}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 mt-2 italic">
                            No description provided
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 p-2.5 md:p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl shadow-inner border border-primary/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>
                    </div>

                    <div className="pt-4 md:pt-5 mt-auto border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <span>{group.createdAt ? new Date(group.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                        <ArrowRight className="w-4 h-4 ml-2 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 md:pt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-border bg-card/60 backdrop-blur-md rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors text-foreground flex items-center justify-center shadow-sm"
                title="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5 px-5 py-2 bg-card/60 backdrop-blur-md border border-border rounded-xl shadow-sm">
                <span className="text-sm font-semibold text-foreground">Page {currentPage}</span>
                <span className="text-sm font-medium text-muted-foreground">of {totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-border bg-card/60 backdrop-blur-md rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors text-foreground flex items-center justify-center shadow-sm"
                title="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
