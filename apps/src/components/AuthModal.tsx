import { useState, useEffect, type ReactNode } from 'react'
import { Dialog } from '@headlessui/react'
import { Check } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { initiateAuth, type AuthProvider } from '../lib/authFlow'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * 'limit' = hard, conversion-focused dialog shown when an anonymous visitor
   * runs out of credits: it can only be closed via the explicit opt-out link.
   * 'standard' = regular sign-in dialog (header button, fallbacks).
   */
  variant?: 'standard' | 'limit'
}

const PROVIDERS: Array<{ id: AuthProvider; label: string; icon: ReactNode }> = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
    ),
  },
  {
    id: 'discord',
    label: 'Continue with Discord',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#5865F2" d="M20.32 4.37A19.8 19.8 0 0 0 15.36 3l-.23.46a13.2 13.2 0 0 1 3.7 1.84 18.2 18.2 0 0 0-13.66 0 13.2 13.2 0 0 1 3.7-1.84L8.64 3a19.8 19.8 0 0 0-4.96 1.37C.56 8.98-.24 13.47.17 17.9a19.9 19.9 0 0 0 6.07 3.03l.76-1.55a11.9 11.9 0 0 1-1.98-.94c.17-.12.33-.25.48-.38a14.2 14.2 0 0 0 12.99 0c.16.13.32.26.49.38-.63.37-1.3.69-1.99.94l.76 1.55a19.9 19.9 0 0 0 6.07-3.03c.5-5.13-.83-9.58-3.5-13.53zM8.35 15.28c-1.18 0-2.16-1.08-2.16-2.41s.95-2.42 2.16-2.42 2.18 1.09 2.16 2.42c0 1.33-.95 2.41-2.16 2.41zm7.3 0c-1.18 0-2.16-1.08-2.16-2.41s.95-2.42 2.16-2.42 2.18 1.09 2.16 2.42c0 1.33-.95 2.41-2.16 2.41z"/>
      </svg>
    ),
  },
]

const LIMIT_BENEFITS = [
  '+7 bonus generations added instantly',
  'Your remaining credits carry over — nothing lost',
  'Refills to 3 free every day (anonymous credits never reset)',
  'Prompts & preferences saved across devices',
]

export function AuthModal({ isOpen, onClose, variant = 'standard' }: AuthModalProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [busy, setBusy] = useState<AuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    supabase?.auth.getSession().then(({ data: { session: s } }) => setSession(s))
  }, [isOpen])

  const isAnonymous = !!session?.user?.is_anonymous
  const hard = variant === 'limit'

  const handleSignIn = async (provider: AuthProvider) => {
    setBusy(provider)
    setError(null)
    try {
      const { error: err } = await initiateAuth(provider)
      // On success the browser redirects to /auth/callback; only errors return.
      if (err) setError(err)
    } finally {
      setBusy(null)
    }
  }

  const buttons = (
    <div className="flex flex-col gap-2.5">
      {PROVIDERS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => handleSignIn(id)}
          disabled={busy !== null}
          className={`flex items-center justify-center gap-3 w-full py-3 px-4 bg-white border-2 border-[#1c1c1c] rounded-xl font-semibold text-sm text-[#1a1a1a] hover:bg-[#f0b429] transition-colors disabled:opacity-60 ${id === 'google' ? 'ring-2 ring-[#f0b429] ring-offset-2' : ''}`}
        >
          {icon}
          {busy === id ? 'Redirecting…' : label}
        </button>
      ))}
    </div>
  )

  return (
    <Dialog
      open={isOpen}
      // Hard variant: backdrop clicks and Escape are ignored — only the
      // explicit opt-out link below may close the dialog.
      onClose={hard ? () => {} : onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-md rounded-2xl bg-white border-2 border-[#1c1c1c] p-6 shadow-xl">
          {hard ? (
            <>
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff8e6] border border-[#f0b429] text-xs font-semibold text-[#1a1a1a]">
                  🎁 Free generations used
                </span>
              </div>
              <Dialog.Title className="text-2xl font-bold text-[#1a1a1a] text-center mb-1.5">
                Claim 7 more — free
              </Dialog.Title>
              <Dialog.Description className="text-sm text-[#6b6559] text-center mb-5">
                Sign in and we'll add <strong className="text-[#1a1a1a]">7 bonus generations</strong> to your account instantly.
              </Dialog.Description>

              <ul className="flex flex-col gap-2 mb-5 px-1">
                {LIMIT_BENEFITS.map(benefit => (
                  <li key={benefit} className="flex items-start gap-2 text-sm text-[#1a1a1a]">
                    <Check className="w-4 h-4 text-[#0a8a3a] mt-0.5 shrink-0" strokeWidth={3} />
                    {benefit}
                  </li>
                ))}
              </ul>

              {buttons}

              {error && (
                <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <p className="mt-3 text-xs text-[#9a9080] text-center">
                No credit card · Takes 5 seconds
              </p>

              <button
                onClick={onClose}
                className="mt-3 w-full text-center text-xs text-[#9a9080] hover:text-[#6b6559] underline underline-offset-2 transition-colors"
              >
                No thanks — I'll keep my 3 one-time credits
              </button>
            </>
          ) : (
            <>
              <Dialog.Title className="text-xl font-semibold text-[#1a1a1a] mb-2">
                {isAnonymous ? 'Claim your bonus generations' : 'Sign in to get more generations'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-[#6b6559] mb-5">
                {isAnonymous
                  ? "Sign in now and we'll add 7 bonus generations to your account instantly. Your credits carry over."
                  : 'Get 3 free optimizations every day — no credit card required.'}
              </Dialog.Description>

              {buttons}

              {error && (
                <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <p className="mt-4 text-xs text-[#9a9080] text-center">
                Free to join · Your credits carry over when you sign in
              </p>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
