'use client'

import { useState } from 'react'
import { markSettledService } from '@/services/expense.service'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Settlement } from '@/types'

export default function SettlementsList({
  settlements,
  groupId,
  defaultCurrency,
}: {
  settlements: Settlement[]
  groupId: string
  defaultCurrency: string
}) {
  const [marking, setMarking] = useState<string | null>(null)
  const router = useRouter()

  const handleMarkSettled = async (settlementId: string) => {
    setMarking(settlementId)
    try {
      await markSettledService(settlementId)
      router.refresh()
    } catch (err) {
      console.error('Failed to mark settled:', err)
    } finally {
      setMarking(null)
    }
  }

  const unsettled = settlements.filter((s) => !s.settled)
  const settled = settlements.filter((s) => s.settled)

  const totalUnsettledByCurrency = unsettled.reduce((acc, s) => {
    const currency = s.currency || 'USD'
    if (!acc[currency]) acc[currency] = 0
    acc[currency] += parseFloat(s.amount as string)
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settlements</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track who owes whom
        </p>
      </div>

      {unsettled.length === 0 && settled.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">No settlements to display</p>
        </div>
      ) : (
        <div className="space-y-8">
          {unsettled.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Pending
                </h3>
                <div className="flex gap-2">
                  {Object.entries(totalUnsettledByCurrency).map(([curr, amt]) => (
                    <span key={curr} className="text-lg font-bold text-primary">
                      {curr} {amt.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {unsettled.map((settlement) => (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {(settlement.userFrom?.name || settlement.userFrom?.email || settlement.from)[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {settlement.userFrom?.name || settlement.userFrom?.email || settlement.from}
                          </span>{' '}
                          owes{' '}
                          <span className="font-medium text-foreground">
                            {settlement.userTo?.name || settlement.userTo?.email || settlement.to}
                          </span>
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {settlement.currency || 'USD'} {parseFloat(settlement.amount as string).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMarkSettled(settlement.id)}
                      disabled={marking === settlement.id}
                      className="ml-4 p-2 hover:bg-green-500/10 rounded-lg transition-colors text-green-600 disabled:opacity-50"
                      title="Mark as settled"
                    >
                      {marking === settlement.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {settled.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Settled</h3>
              <div className="space-y-2">
                {settled.map((settlement) => (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-lg opacity-75"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground line-through">
                          <span className="font-medium text-foreground">
                            {settlement.userFrom?.name || settlement.userFrom?.email || settlement.from}
                          </span>{' '}
                          owes{' '}
                          <span className="font-medium text-foreground">
                            {settlement.userTo?.name || settlement.userTo?.email || settlement.to}
                          </span>
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground line-through">
                        {settlement.currency || 'USD'} {parseFloat(settlement.amount as string).toFixed(2)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-4">
                      {settlement.settledAt &&
                        new Date(settlement.settledAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
