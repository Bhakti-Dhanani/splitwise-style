'use client'

import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string | null
  createdAt: Date
}

export default function GroupsList({ groups }: { groups: Group[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <Link key={group.id} href={`/groups/${group.id}`}>
          <div className="group relative h-full bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer">
            {/* Subtle Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
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
                <div className="flex-shrink-0 p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl shadow-inner border border-primary/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>

              <div className="pt-5 mt-auto border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Active
                  </span>
                </div>
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  <span>{new Date(group.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <ArrowRight className="w-4 h-4 ml-2 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
