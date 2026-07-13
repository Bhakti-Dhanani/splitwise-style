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
          <div className="group relative h-full p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {group.description}
                  </p>
                )}
              </div>
              <div className="ml-4 p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Created {new Date(group.createdAt).toLocaleDateString()}
              </span>
              <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
