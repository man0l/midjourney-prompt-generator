import { useCallback, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { shouldNudgeSignIn } from '../lib/authFlow';

export type AuthModalVariant = 'standard' | 'limit';

/**
 * Shared state for the sign-in modal. 'limit' is the hard, non-dismissable
 * conversion modal shown when an anonymous visitor runs out of credits;
 * 'standard' is the regular sign-in dialog (header button, fallbacks).
 */
export function useAuthNudge(session: Session | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState<AuthModalVariant>('standard');

  const openAuthModal = useCallback((v: AuthModalVariant = 'standard') => {
    setVariant(v);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    setVariant('standard');
  }, []);

  return {
    isOpen,
    variant,
    openAuthModal,
    closeAuthModal,
    needsSignIn: shouldNudgeSignIn(session),
  };
}
