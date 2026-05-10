import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface PriceIds {
  starterMonthly: string;
  starterYearly: string;
  proMonthly: string;
  proYearly: string;
  unlimitedMonthly: string;
  unlimitedYearly: string;
}

interface Props {
  priceIds: PriceIds;
}

const plans = [
  {
    key: 'free',
    name: 'Free',
    tagline: 'Try it out',
    monthly: 0,
    yearly: 0,
    yearlyTotal: 0,
    features: [
      '3 premium requests/day',
      '3 assistant requests/day',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    key: 'starter',
    name: 'Starter',
    tagline: 'For casual users',
    monthly: 9,
    yearly: 7.2,
    yearlyTotal: 86.4,
    features: [
      '500 premium requests/month',
      '500 assistant requests/month',
      'All prompt templates',
      'Email support',
    ],
    cta: 'Get Starter',
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'For individuals getting started',
    monthly: 19,
    yearly: 15.2,
    yearlyTotal: 182.4,
    features: [
      '1,500 premium requests/month',
      '1,500 assistant requests/month',
      'All prompt templates',
      'Email support',
    ],
    cta: 'Get Pro',
    highlighted: true,
  },
  {
    key: 'unlimited',
    name: 'Unlimited',
    tagline: 'For power users and teams',
    monthly: 49,
    yearly: 39.2,
    yearlyTotal: 470.4,
    features: [
      'Unlimited premium requests/month',
      'Unlimited assistant requests/month',
      'All prompt templates',
      'Priority support',
    ],
    cta: 'Get Unlimited',
    highlighted: false,
  },
];

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

const PENDING_PLAN_KEY = 'pending_checkout_plan';

export default function PricingSection({ priceIds }: Props) {
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  function getPriceId(planKey: string): string {
    const map: Record<string, string> = {
      starter: yearly ? priceIds.starterYearly : priceIds.starterMonthly,
      pro: yearly ? priceIds.proYearly : priceIds.proMonthly,
      unlimited: yearly ? priceIds.unlimitedYearly : priceIds.unlimitedMonthly,
    };
    return map[planKey] ?? '';
  }

  async function startCheckout(planKey: string, accessToken: string) {
    setLoadingPlan(planKey);
    sessionStorage.removeItem(PENDING_PLAN_KEY);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ priceId: getPriceId(planKey) }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setLoadingPlan(null);
    }
  }

  // Auto-checkout after sign-in if there's a pending plan
  useEffect(() => {
    // Check immediately on mount — covers the OAuth redirect case where SIGNED_IN
    // already fired before this component registered its listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const pending = sessionStorage.getItem(PENDING_PLAN_KEY);
      if (pending) startCheckout(pending, session.access_token);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      const pending = sessionStorage.getItem(PENDING_PLAN_KEY);
      if (pending) startCheckout(pending, session.access_token);
    });
    return () => subscription.unsubscribe();
  }, [yearly]); // re-register when billing period toggles so getPriceId stays fresh

  async function handleCheckout(planKey: string) {
    if (planKey === 'free') {
      document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      sessionStorage.setItem(PENDING_PLAN_KEY, planKey);
      window.dispatchEvent(new Event('openAuthModal'));
      return;
    }

    await startCheckout(planKey, session.access_token);
  }

  return (
    <div id="pricing" className="px-6 pt-6 pb-6">
      {/* Heading + toggle */}
      <div className="text-center space-y-3 mb-6">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Simple, Transparent Pricing</h2>
        <p className="text-[#6b6559] text-sm">Start free, upgrade when you're ready.</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <span className={`text-sm ${yearly ? 'text-[#6b6559]' : 'font-semibold text-[#1a1a1a]'}`}>
            Monthly
          </span>
          <button
            role="switch"
            aria-checked={yearly}
            onClick={() => setYearly(y => !y)}
            className="relative w-11 h-6 border border-[#1c1c1c] rounded-full transition-colors focus:outline-none"
            style={{ backgroundColor: yearly ? '#f0b429' : '#c8c0a8' }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-[#1a1a1a] rounded-full transition-transform duration-200"
              style={{ transform: yearly ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
          <span className={`text-sm ${yearly ? 'font-semibold text-[#1a1a1a]' : 'text-[#6b6559]'}`}>
            Yearly{' '}
            <span className="bg-[#1c1c1c] text-[#f0b429] text-xs font-bold px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 pt-3">
        {plans.map(plan => {
          const isLoading = loadingPlan === plan.key;
          return (
            <div
              key={plan.name}
              className={`rounded-xl p-6 flex flex-col relative ${
                plan.highlighted
                  ? 'bg-[#f0b429] border-2 border-[#1c1c1c]'
                  : 'border border-[#c8c0a8]'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#1c1c1c] text-[#f0b429] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`mb-4 ${plan.highlighted ? 'mt-2' : ''}`}>
                <h3 className="text-lg font-bold text-[#1a1a1a]">{plan.name}</h3>
                <p className="text-[#6b6559] text-xs mt-0.5">{plan.tagline}</p>
              </div>

              <div className="mb-5">
                <span className="text-3xl font-bold text-[#1a1a1a]">
                  €{fmt(yearly ? plan.yearly : plan.monthly)}
                </span>
                <span className={`text-sm ${plan.highlighted ? 'text-[#1a1a1a]' : 'text-[#6b6559]'}`}>
                  /mo
                </span>
                {yearly && plan.monthly > 0 && (
                  <p className="text-[#6b6559] text-xs mt-0.5">
                    billed as €{fmt(plan.yearlyTotal)}/yr
                  </p>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#1a1a1a]">
                    <span className="text-base">✅</span> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.key)}
                disabled={isLoading}
                className={`block w-full py-3 border-2 border-[#1c1c1c] rounded-xl text-center font-bold text-sm transition-colors disabled:opacity-60 ${
                  plan.highlighted
                    ? 'bg-[#1c1c1c] text-[#f0b429] hover:brightness-110'
                    : 'text-[#1a1a1a] hover:bg-[#f0b429]'
                }`}
              >
                {isLoading ? 'Redirecting...' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* What's included */}
      <div className="border border-[#c8c0a8] rounded-xl p-6">
        <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">What's included?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <p className="font-semibold text-[#1a1a1a] text-sm">Prompts</p>
              <p className="text-[#6b6559] text-xs mt-0.5">
                Prompt generations and refinements included in your monthly plan.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-semibold text-[#1a1a1a] text-sm">Prompt Assistant</p>
              <p className="text-[#6b6559] text-xs mt-0.5">
                Run and iterate on your prompts with fast AI models, right inside Prompt Builder.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fine print */}
      <p className="text-center text-[#6b6559] text-xs mt-2">
        All plans include access to our core features. Need a custom plan?{' '}
        <a
          href="mailto:manol.trendafilov@gmail.com"
          className="text-[#1a1a1a] underline decoration-[#f0b429] underline-offset-2 hover:text-[#f0b429]"
        >
          Contact us
        </a>
      </p>
    </div>
  );
}
