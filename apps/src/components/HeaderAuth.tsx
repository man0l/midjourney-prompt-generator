import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function HeaderAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Anonymous (free-tier) sessions have no profile — keep showing Sign In.
  if (!user || user.is_anonymous) {
    return (
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
        className="px-5 py-2 bg-[#f0b429] text-[#1a1a1a] font-semibold rounded-lg border-2 border-[#1c1c1c] hover:brightness-95 transition-all"
      >
        Sign In
      </button>
    );
  }

  const label = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 border-2 border-[#1c1c1c] rounded-lg bg-white hover:bg-[#f0b429] transition-all text-sm font-semibold text-[#1a1a1a]"
      >
        {user.user_metadata?.avatar_url && (
          <img src={user.user_metadata.avatar_url} className="w-5 h-5 rounded-full" />
        )}
        {label}
        <span className="text-xs opacity-60">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border-2 border-[#1c1c1c] rounded-xl shadow-lg min-w-[160px] z-50 overflow-hidden">
          <a
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f5f0e4] transition-colors"
          >
            My Account
          </a>
          <a
            href="/#pricing"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f5f0e4] transition-colors"
          >
            Upgrade Plan
          </a>
          <button
            onClick={async () => { await supabase.auth.signOut(); setOpen(false); }}
            className="block w-full text-left px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f5f0e4] transition-colors border-t border-[#e8e0cc]"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
