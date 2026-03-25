import { Dialog } from '@headlessui/react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseClient'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-xl bg-background-start/95 backdrop-blur-glass border border-accent/20 p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold text-text mb-4">
            Sign in to optimize prompts
          </Dialog.Title>
          <Dialog.Description className="text-text/80 mb-4">
            Get 8 free optimizations every day
          </Dialog.Description>
          
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#1a73e8',
                    brandAccent: '#1557b0',
                    backgroundSecondary: 'rgba(255, 255, 255, 0.05)',
                    backgroundAccent: 'rgba(255, 255, 255, 0.1)',
                  }
                }
              },
              className: {
                container: 'text-text',
                label: 'text-text/80',
                button: 'bg-[#1a73e8] hover:bg-[#1557b0] text-white',
                input: 'bg-white/5 border-accent/20 text-text placeholder-text/50',
              }
            }}
            providers={['google', 'discord']}
            providerScopes={{
              discord: 'identify email'
            }}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 