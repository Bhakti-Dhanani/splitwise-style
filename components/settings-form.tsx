'use client'

import { useState } from 'react'
import { updateDefaultCurrencyService } from '@/services/user.service'
import { Loader2 } from 'lucide-react'

export function SettingsForm({ initialCurrency }: { initialCurrency: string }) {
  const [currency, setCurrency] = useState(initialCurrency)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      await updateDefaultCurrencyService(currency)
      setMessage('Settings updated successfully!')
    } catch (error) {
      setMessage('Failed to update settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Default Currency</label>
      <div className="flex gap-4 items-center">
        <select 
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm max-w-xs focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="INR">INR (₹)</option>
          <option value="AUD">AUD (A$)</option>
          <option value="CAD">CAD (C$)</option>
          <option value="JPY">JPY (¥)</option>
        </select>
        <button
          onClick={handleSave}
          disabled={loading || currency === initialCurrency}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium min-w-[80px] flex justify-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
        </button>
      </div>
      {message && (
        <p className={`text-sm mt-1 ${message.includes('success') ? 'text-emerald-500' : 'text-destructive'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
