'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfileService } from '@/services/user.service'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Camera, 
  Trash2, 
  Loader2, 
  User, 
  Mail, 
  Globe, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  UserCheck, 
  Receipt, 
  Calendar,
  Save,
  Smile,
  ShieldCheck,
  X,
  Upload
} from 'lucide-react'

const AVATAR_PRESETS = [
  // 1. Cool Guy with Sunglasses & Hoodie
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="100%" stop-color="%23a855f7"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g1)"/><path d="M 18 100 C 18 68, 82 68, 82 100 Z" fill="%234f46e5"/><rect x="42" y="52" width="16" height="18" rx="8" fill="%23fde68a"/><circle cx="50" cy="42" r="23" fill="%23fde68a"/><path d="M 27 38 C 25 20, 75 20, 73 38 Z" fill="%230f172a"/><path d="M 28 36 L 48 36 L 46 48 L 30 48 Z" fill="%230f172a"/><path d="M 52 36 L 72 36 L 70 48 L 54 48 Z" fill="%230f172a"/><line x1="48" y1="40" x2="52" y2="40" stroke="%230f172a" stroke-width="3"/><line x1="32" y1="38" x2="42" y2="46" stroke="%23ffffff" stroke-width="2" opacity="0.6"/><line x1="56" y1="38" x2="66" y2="46" stroke="%23ffffff" stroke-width="2" opacity="0.6"/><path d="M 40 56 Q 50 64 60 56" stroke="%230f172a" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  
  // 2. Happy Girl with Wavy Hair & Wink
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g2)"/><path d="M 16 36 C 8 60, 20 95, 28 100 C 40 85, 60 85, 72 100 C 80 95, 92 60, 84 36 Z" fill="%231e293b"/><path d="M 20 100 C 20 68, 80 68, 80 100 Z" fill="%230284c7"/><rect x="43" y="52" width="14" height="18" rx="7" fill="%23fde68a"/><circle cx="50" cy="42" r="23" fill="%23fde68a"/><path d="M 25 36 C 24 20, 76 20, 75 36 Z" fill="%231e293b"/><circle cx="38" cy="42" r="4" fill="%231e293b"/><circle cx="39" cy="40.5" r="1.5" fill="%23ffffff"/><path d="M 56 42 Q 62 36 68 42" stroke="%231e293b" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M 36 54 Q 50 68 64 54 Z" fill="%23ef4444" stroke="%231e293b" stroke-width="2"/></svg>',
  
  // 3. Bearded Gamer with Headset
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g3)"/><path d="M 18 100 C 18 68, 82 68, 82 100 Z" fill="%23be185d"/><rect x="42" y="52" width="16" height="18" rx="8" fill="%23f59e0b"/><path d="M 32 46 C 32 80, 68 80, 68 46 Z" fill="%2378350f"/><circle cx="50" cy="42" r="22" fill="%23f59e0b"/><path d="M 26 36 C 24 20, 76 20, 74 36 Z" fill="%2378350f"/><path d="M 20 40 C 20 18, 80 18, 80 40" stroke="%2306b6d4" stroke-width="5" fill="none"/><rect x="14" y="32" width="12" height="20" rx="5" fill="%2306b6d4"/><rect x="74" y="32" width="12" height="20" rx="5" fill="%2306b6d4"/><circle cx="38" cy="42" r="4" fill="%231e293b"/><circle cx="62" cy="42" r="4" fill="%231e293b"/><path d="M 42 56 Q 50 62 58 56" stroke="%23ffffff" stroke-width="2.5" fill="none"/></svg>',

  // 4. Cute Anime Girl with Star Eyes & Beret
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ec4899"/><stop offset="100%" stop-color="%238b5cf6"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g4)"/><path d="M 14 36 C 6 60, 20 95, 28 100 C 40 85, 60 85, 72 100 C 80 95, 94 60, 86 36 Z" fill="%23f472b6"/><path d="M 20 100 C 20 68, 80 68, 80 100 Z" fill="%237c3aed"/><rect x="43" y="52" width="14" height="18" rx="7" fill="%23fde68a"/><circle cx="50" cy="42" r="23" fill="%23fde68a"/><path d="M 22 28 C 22 12, 78 12, 78 28 Z" fill="%238b5cf6"/><rect x="20" y="24" width="60" height="8" rx="4" fill="%236d28d9"/><circle cx="50" cy="10" r="5" fill="%23f59e0b"/><path d="M 38 36 L 40 41 L 45 42 L 41 45 L 42 50 L 38 47 L 34 50 L 35 45 L 31 42 L 36 41 Z" fill="%23f59e0b"/><path d="M 62 36 L 64 41 L 69 42 L 65 45 L 66 50 L 62 47 L 58 50 L 59 45 L 55 42 L 60 41 Z" fill="%23f59e0b"/><path d="M 40 56 Q 50 64 60 56" stroke="%231e293b" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',

  // 5. Smart Guy with Round Glasses & Beanie
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%236366f1"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g5)"/><path d="M 18 100 C 18 68, 82 68, 82 100 Z" fill="%231d4ed8"/><rect x="42" y="52" width="16" height="18" rx="8" fill="%23fde68a"/><circle cx="50" cy="42" r="23" fill="%23fde68a"/><path d="M 24 32 C 24 10, 76 10, 76 32 Z" fill="%23ef4444"/><rect x="22" y="28" width="56" height="8" rx="3" fill="%23b91c1c"/><circle cx="38" cy="42" r="8" fill="none" stroke="%231e293b" stroke-width="2.5"/><circle cx="62" cy="42" r="8" fill="none" stroke="%231e293b" stroke-width="2.5"/><line x1="46" y1="42" x2="54" y2="42" stroke="%231e293b" stroke-width="2.5"/><circle cx="38" cy="42" r="3.5" fill="%231e293b"/><circle cx="62" cy="42" r="3.5" fill="%231e293b"/><path d="M 40 56 Q 50 62 60 56" stroke="%231e293b" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',

  // 6. Cool Cat Girl with Cat Ear Headphones
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2384cc16"/><stop offset="100%" stop-color="%2310b981"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g6)"/><path d="M 16 36 C 8 60, 20 95, 28 100 C 40 85, 60 85, 72 100 C 80 95, 92 60, 84 36 Z" fill="%23a855f7"/><path d="M 20 100 C 20 68, 80 68, 80 100 Z" fill="%23047857"/><rect x="43" y="52" width="14" height="18" rx="7" fill="%23fde68a"/><circle cx="50" cy="42" r="23" fill="%23fde68a"/><polygon points="25,28 30,10 42,22" fill="%23ec4899"/><polygon points="75,28 70,10 58,22" fill="%23ec4899"/><path d="M 20 38 C 20 18, 80 18, 80 38" stroke="%23ec4899" stroke-width="4" fill="none"/><rect x="14" y="30" width="12" height="18" rx="5" fill="%23ec4899"/><rect x="74" y="30" width="12" height="18" rx="5" fill="%23ec4899"/><circle cx="38" cy="42" r="4" fill="%231e293b"/><circle cx="62" cy="42" r="4" fill="%231e293b"/><path d="M 40 56 Q 50 64 60 56" stroke="%231e293b" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
]

interface ProfileFormProps {
  user: {
    id: string
    name: string
    email: string
    image: string | null
    defaultCurrency?: string
    createdAt?: Date | string
  }
  stats: {
    groupsCount: number
    friendsCount: number
    expensesCount: number
  }
}

export function ProfileForm({ user, stats }: ProfileFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user.name || '')
  const [image, setImage] = useState<string | null>(user.image || null)
  const [currency, setCurrency] = useState(user.defaultCurrency || 'USD')
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([
    'USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CHF', 'CNY', 'SGD'
  ])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPresets, setShowPresets] = useState(false)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)

  // Fetch currency options
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates) {
          setAvailableCurrencies(Object.keys(data.rates))
        }
      })
      .catch((err) => console.error('Failed to fetch currency list:', err))
  }, [])

  // Image upload with compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB.' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 160
        const MAX_HEIGHT = 160
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.70)
        setImage(compressedDataUrl)
        setMessage(null)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Full Name cannot be empty.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          image: image,
          defaultCurrency: currency,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred while saving.' })
    } finally {
      setLoading(false)
    }
  }

  const isDirty = 
    name !== user.name || 
    image !== user.image || 
    currency !== (user.defaultCurrency || 'USD')

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently'

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* ========================================================================= */}
      {/* 1. HERO SHOWCASE CARD WITH ROUND CIRCULAR AVATAR */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Cover Art Banner - Sleek Theme Neutral Plate */}
        <div className="h-44 sm:h-56 w-full bg-muted/30 border-b border-border/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          
          {/* Active Status Badge */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border text-xs font-semibold text-foreground shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Active Member</span>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 sm:px-10 pb-8 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-20 sm:-mt-24">
          
          {/* Left Side: Circular Avatar + Name/Email */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            
            {/* Round Circular Avatar Frame */}
            <div className="relative group shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full ring-4 ring-card bg-card shadow-2xl overflow-hidden flex items-center justify-center relative border border-border/40 transition-transform duration-300 group-hover:scale-[1.02]">
                {image ? (
                  <img
                    src={image}
                    alt={name || 'User Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center">
                    <span className="text-5xl font-black text-white tracking-widest drop-shadow-md">
                      {name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}

                {/* Circular Hover Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer backdrop-blur-[3px] rounded-full"
                  title="Click to upload profile photo"
                >
                  <Camera className="w-8 h-8 mb-1 text-white animate-bounce" />
                  <span className="text-xs font-bold tracking-wider">Change Photo</span>
                </button>
              </div>

              {/* Floating Camera Upload Button on Avatar Edge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2.5 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-200 ring-4 ring-card"
                title="Upload Photo"
              >
                <Camera className="w-4.5 h-4.5" />
              </button>

              {/* Floating 'X' Delete Badge (Only visible when image exists) */}
              {image && (
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute top-1 right-1 p-2 rounded-full bg-destructive text-destructive-foreground shadow-xl hover:bg-destructive/90 hover:scale-110 active:scale-95 transition-all duration-200 ring-4 ring-card"
                  title="Remove Profile Picture"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Name & Email Info Header */}
            <div className="space-y-1.5 pb-1">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                  {name || 'User Profile'}
                </h1>
                <span title="Verified Account">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 fill-emerald-500/20" />
                </span>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border/60 font-medium">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Clean Action Toolbar */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold text-xs transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-muted/80 hover:bg-muted border border-border text-foreground font-semibold text-xs transition-all active:scale-95"
            >
              <Smile className="w-4 h-4 text-primary" />
              <span>{showPresets ? 'Hide Gallery' : 'Avatar Gallery'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Avatar Gallery Drawer */}
        {showPresets && (
          <div className="px-8 py-6 border-t border-border/60 bg-muted/30 backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Avatar Gallery</h3>
                <p className="text-xs text-muted-foreground">Select a custom vector illustration avatar</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPresets(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              {AVATAR_PRESETS.map((presetUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImage(presetUrl)
                    setShowPresets(false)
                  }}
                  className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-110 shadow-sm ${
                    image === presetUrl ? 'border-primary ring-4 ring-primary/30 scale-105 shadow-md' : 'border-transparent hover:border-border'
                  }`}
                >
                  <img src={presetUrl} alt={`Avatar Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MODERN STATISTICS GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-3xl border border-border/80 bg-card p-6 flex items-center gap-4 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Groups</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{stats.groupsCount}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-6 flex items-center gap-4 shadow-lg hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Friends</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{stats.friendsCount}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-6 flex items-center gap-4 shadow-lg hover:shadow-xl hover:border-purple-500/50 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expenses Paid</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{stats.expensesCount}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-6 flex items-center gap-4 shadow-lg hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Joined</p>
            <p className="text-sm font-black text-foreground mt-1">{joinedDate}</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PERSONAL INFORMATION FORM CARD */}
      {/* ========================================================================= */}
      <form onSubmit={handleSave} className="rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-border/60 flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Update your account details and default preferences
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-7">
          {/* Notification Alert Banner */}
          {message && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold animate-in fade-in duration-200 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-destructive/10 border-destructive/30 text-destructive'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          <div className="grid gap-7 md:grid-cols-2">
            {/* Full Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-input bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-sm"
              />
            </div>

            {/* Email Address Input (Read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3.5 rounded-2xl border border-input bg-muted/50 text-muted-foreground text-sm font-medium cursor-not-allowed opacity-80 shadow-sm"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
            </div>

            {/* Default Currency Field */}
            <div className="space-y-2 md:col-span-2 sm:max-w-md">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Default Currency
              </label>
              <Select value={currency} onValueChange={(val) => val && setCurrency(val)}>
                <SelectTrigger className="w-full h-12 px-4 rounded-2xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm">
                  <SelectValue placeholder="Select Default Currency" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="max-h-60 overflow-y-auto">
                  {availableCurrencies.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This currency will be pre-selected when creating new expenses.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="px-6 sm:px-8 py-5 bg-muted/20 border-t border-border/60 flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-muted-foreground">
            {isDirty ? '● Unsaved changes pending' : '✓ All changes saved'}
          </span>
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground font-bold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
