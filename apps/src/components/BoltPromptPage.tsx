import React, { useState, useCallback, useEffect } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';
import { generateBoltPrompt, type BoltParameters } from '../utils/boltPromptGenerator';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { useCredits } from '../hooks/useCredits';
import { AuthModal } from '../components/AuthModal';
import { ensureSession } from '../lib/session';

const APP_TYPES = ['----', 'Web App', 'SaaS Platform', 'Dashboard / Admin Panel', 'E-commerce Store', 'Landing Page', 'API / Backend', 'Mobile App (PWA)', 'Browser Extension', 'CLI Tool'];
const TECH_STACKS = ['----', 'React + Node.js', 'Next.js', 'Vue.js + Express', 'SvelteKit', 'Remix', 'Astro', 'React Native', 'Vanilla JS'];
const UI_FRAMEWORKS = ['----', 'shadcn/ui', 'Tailwind CSS', 'Material UI', 'Chakra UI', 'Ant Design', 'Radix UI', 'Headless UI', 'None'];
const DATABASES = ['----', 'PostgreSQL', 'Supabase', 'MongoDB', 'SQLite', 'Firebase', 'PlanetScale', 'Prisma + PostgreSQL', 'None'];
const AUTH_OPTIONS = ['----', 'Email / Password', 'OAuth (Google, GitHub)', 'Magic Link', 'JWT', 'Clerk', 'Auth.js (NextAuth)', 'Supabase Auth', 'None'];
const STYLING_OPTIONS = ['----', 'Tailwind CSS', 'CSS Modules', 'Styled Components', 'Sass/SCSS', 'Plain CSS'];

const SelectField = ({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 bg-white border border-[#c8c0a8] rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:border-[#f0b429] transition-colors"
    >
      {options.map(o => <option key={o} value={o}>{o === '----' ? `Select ${label}` : o}</option>)}
    </select>
  </div>
);

export default function BoltPromptPage() {
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState('');
  const [params, setParams] = useState<BoltParameters>({
    appType: '----', techStack: '----', uiFramework: '----',
    database: '----', auth: '----', styling: '----',
  });
  const [copied, setCopied] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const { credits, plan, useCredit } = useCredits(session?.user ?? null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) setIsAuthModalOpen(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = () => setIsAuthModalOpen(true);
    window.addEventListener('openAuthModal', handler);
    return () => window.removeEventListener('openAuthModal', handler);
  }, []);

  function showLimit(msg: string) {
    setLimitMessage(msg);
    setTimeout(() => setLimitMessage(null), 4000);
  }

  const handleParamChange = useCallback(<K extends keyof BoltParameters>(key: K, value: BoltParameters[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const fullPrompt = generateBoltPrompt(description, params, features);

  const handleCopy = async () => {
    if (!fullPrompt) return;
    // No account? Transparently continue as an anonymous user (3 free/day).
    if (!await ensureSession()) { setIsAuthModalOpen(true); return; }
    if (credits === 0) {
      showLimit(plan === 'free'
        ? "You've used all your free credits for today. They reset tomorrow."
        : "You've used all your credits for this month. They reset on the 1st.");
      return;
    }
    const success = await useCredit();
    if (success) {
      navigator.clipboard.writeText(fullPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setDescription('');
    setFeatures('');
    setParams({ appType: '----', techStack: '----', uiFramework: '----', database: '----', auth: '----', styling: '----' });
  };

  return (
    <>
      <SEO
        title="Bolt Prompt Generator"
        description="Generate perfect Bolt.new prompts for fully-functional apps. Free Bolt prompt generator — no sign-up needed."
      />
      <div className="px-6 py-8 animate-fade-in">

        {/* Main inputs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="md:col-span-3 flex flex-col gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider mb-2">Describe Your App Idea</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. a task management app where teams can assign tasks, track progress, and get deadline reminders..."
                className="min-h-[100px] px-4 py-3 bg-white border border-[#c8c0a8] rounded-xl text-[#1a1a1a] placeholder-[#9a9080] resize-none focus:outline-none focus:border-[#f0b429] transition-colors text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider mb-2">Core Features <span className="normal-case font-normal text-[#9a9080]">(one per line)</span></label>
              <textarea
                value={features}
                onChange={e => setFeatures(e.target.value)}
                placeholder={`User authentication\nDashboard with charts\nReal-time notifications\nExport to CSV`}
                className="min-h-[100px] px-4 py-3 bg-white border border-[#c8c0a8] rounded-xl text-[#1a1a1a] placeholder-[#9a9080] resize-none focus:outline-none focus:border-[#f0b429] transition-colors text-sm font-mono"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col">
            <label className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider mb-2">Generated Bolt Prompt</label>
            <div className="flex-1 px-4 py-3 bg-white border border-[#c8c0a8] rounded-xl font-mono text-xs text-[#1a1a1a] mb-3 min-h-[200px] overflow-auto whitespace-pre-wrap leading-relaxed">
              {fullPrompt || <span className="text-[#9a9080]">Your ready-to-use Bolt prompt will appear here...</span>}
            </div>
            {limitMessage && (
              <div className="flex items-center gap-2 px-4 py-3 mb-3 bg-[#fff8e6] border border-[#f0b429] rounded-xl text-sm text-[#1a1a1a]">
                <span>⚠️</span>
                <span>{limitMessage}</span>
                <a href="/#pricing" className="ml-auto font-semibold underline decoration-[#f0b429] underline-offset-2 hover:text-[#f0b429] whitespace-nowrap">Upgrade</a>
              </div>
            )}
            <button
              onClick={handleCopy}
              disabled={!fullPrompt}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#f0b429] border-2 border-[#1c1c1c] rounded-xl font-semibold text-[#1a1a1a] hover:brightness-95 transition-all disabled:opacity-40"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : `Copy Bolt Prompt${credits !== null ? ` (${credits} left)` : ''}`}
            </button>
          </div>
        </div>

        {/* Tech stack parameters */}
        <div className="bg-[#e4dfc8] border border-[#c8c0a8] rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider mb-3">Tech Stack</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <SelectField label="App Type" value={params.appType} options={APP_TYPES} onChange={v => handleParamChange('appType', v)} />
            <SelectField label="Framework" value={params.techStack} options={TECH_STACKS} onChange={v => handleParamChange('techStack', v)} />
            <SelectField label="UI Library" value={params.uiFramework} options={UI_FRAMEWORKS} onChange={v => handleParamChange('uiFramework', v)} />
            <SelectField label="Database" value={params.database} options={DATABASES} onChange={v => handleParamChange('database', v)} />
            <SelectField label="Auth" value={params.auth} options={AUTH_OPTIONS} onChange={v => handleParamChange('auth', v)} />
            <SelectField label="Styling" value={params.styling} options={STYLING_OPTIONS} onChange={v => handleParamChange('styling', v)} />
          </div>
        </div>

        <div className="text-center">
          <button onClick={handleClear} className="text-sm text-[#9a9080] hover:text-[#1a1a1a] transition-colors">
            Clear All
          </button>
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
