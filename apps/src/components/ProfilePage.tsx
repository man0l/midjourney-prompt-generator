import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Plan } from '../hooks/useCredits';

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  unlimited: 'Unlimited',
};

const PLAN_MONTHLY_LIMIT: Record<Plan, number | null> = {
  free: null,
  starter: 500,
  pro: 1500,
  unlimited: null,
};

const PLAN_DAILY_LIMIT: Record<Plan, number | null> = {
  free: 3,
  starter: null,
  pro: null,
  unlimited: null,
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan>('free');
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [monthlyUsed, setMonthlyUsed] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/'; return; }
      setUser(session.user);
      fetchData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { window.location.href = '/'; return; }
      setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchData(userId: string) {
    const [creditsRes, subRes] = await Promise.all([
      supabase.from('user_credits').select('credits_remaining, monthly_credits_used').eq('user_id', userId).single(),
      supabase.from('user_subscriptions').select('plan').eq('user_id', userId).single(),
    ]);
    if (creditsRes.data) {
      setCreditsRemaining(creditsRes.data.credits_remaining);
      setMonthlyUsed(creditsRes.data.monthly_credits_used);
    }
    if (subRes.data?.plan) setPlan(subRes.data.plan as Plan);
    setLoading(false);
  }

  async function handleManageBilling() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setPortalLoading(true);
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const monthlyLimit = PLAN_MONTHLY_LIMIT[plan];
  const dailyLimit = PLAN_DAILY_LIMIT[plan];
  const monthlyPct = monthlyLimit ? Math.min(100, Math.round(((monthlyUsed ?? 0) / monthlyLimit) * 100)) : 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1a1a]">Your Account</h1>

      {/* User info */}
      <div className="border border-[#c8c0a8] rounded-xl p-6 flex items-center gap-4">
        {user?.user_metadata?.avatar_url && (
          <img src={user.user_metadata.avatar_url} className="w-12 h-12 rounded-full border border-[#c8c0a8]" />
        )}
        <div>
          <p className="font-semibold text-[#1a1a1a]">{user?.user_metadata?.full_name || '—'}</p>
          <p className="text-sm text-[#6b6559]">{user?.email}</p>
        </div>
      </div>

      {/* Plan */}
      <div className="border border-[#c8c0a8] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider mb-1">Current Plan</p>
            <p className="text-xl font-bold text-[#1a1a1a]">{PLAN_LABELS[plan]}</p>
          </div>
          {plan === 'free' ? (
            <a href="/#pricing" className="px-4 py-2 bg-[#f0b429] border-2 border-[#1c1c1c] rounded-xl text-sm font-bold text-[#1a1a1a] hover:brightness-95 transition-all">
              Upgrade
            </a>
          ) : (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="px-4 py-2 border-2 border-[#1c1c1c] rounded-xl text-sm font-bold text-[#1a1a1a] hover:bg-[#f0b429] transition-all disabled:opacity-60"
            >
              {portalLoading ? 'Loading...' : 'Manage Billing'}
            </button>
          )}
        </div>
      </div>

      {/* Credits */}
      <div className="border border-[#c8c0a8] rounded-xl p-6 space-y-5">
        <p className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider">Credits Usage</p>

        {dailyLimit !== null && (
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium text-[#1a1a1a]">Today</span>
              <span className="text-[#6b6559]">{creditsRemaining ?? '—'} / {dailyLimit} remaining</span>
            </div>
            <div className="h-2 bg-[#e8e0cc] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f0b429] rounded-full transition-all"
                style={{ width: `${dailyLimit ? Math.round(((creditsRemaining ?? 0) / dailyLimit) * 100) : 0}%` }}
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-[#1a1a1a]">This month</span>
            <span className="text-[#6b6559]">
              {monthlyUsed ?? '—'} used
              {monthlyLimit ? ` / ${monthlyLimit}` : ' (unlimited)'}
            </span>
          </div>
          {monthlyLimit && (
            <div className="h-2 bg-[#e8e0cc] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1a1a1a] rounded-full transition-all"
                style={{ width: `${monthlyPct}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
