import React, { useState, useEffect } from 'react';
import { Flame, Copy, Check, ChevronRight } from 'lucide-react';
import SEO from './SEO';
import { roastPrompt, type RoastResult } from '../utils/promptTransformers';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { useCredits } from '../hooks/useCredits';
import { AuthModal } from '../components/AuthModal';
import { ensureSession } from '../lib/session';

function scoreColor(score: number): string {
  if (score >= 7) return 'bg-green-500';
  if (score >= 4) return 'bg-[#f0b429]';
  return 'bg-red-500';
}

function scoreLabel(score: number): string {
  if (score >= 8) return 'text-green-700';
  if (score >= 5) return 'text-amber-700';
  return 'text-red-700';
}

function overallBadgeStyle(score: number): string {
  if (score >= 8) return 'bg-green-100 text-green-800 border-green-300';
  if (score >= 5) return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

export default function RoastMyPromptTool() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<RoastResult | null>(null);
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

  const handleRoast = async () => {
    if (!input.trim()) return;
    // No account? Transparently continue as an anonymous user (3 free/day).
    if (!await ensureSession()) { setIsAuthModalOpen(true); return; }
    if (credits === 0) {
      showLimit(plan === 'free'
        ? "You've used all your free credits for today. They reset tomorrow."
        : "You've used all your credits for this month. They reset on the 1st.");
      return;
    }
    const success = await useCredit();
    if (success) setResult(roastPrompt(input));
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.rewrittenPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const issues = result?.dimensions.filter(d => d.issue) ?? [];

  return (
    <>
      <SEO
        title="Roast My Prompt — Free Prompt Quality Checker"
        description="Paste any ChatGPT, Claude, or AI prompt and get an instant quality score with specific fixes. Free prompt checker — no sign-up."
      />
      <div className="px-6 py-8 animate-fade-in">
        <div className="relative mb-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste your prompt here — e.g. 'Help me write something good about my product'"
            className="w-full min-h-[200px] px-4 py-4 bg-white border border-[#c8c0a8] rounded-xl text-[#1a1a1a] placeholder-[#9a9080] resize-none focus:outline-none focus:border-[#f0b429] transition-colors text-sm"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[#9a9080] text-xs">
            <Flame className="w-3 h-3" /> Prompt Checker
          </div>
        </div>

        {limitMessage && (
          <div className="flex items-center gap-2 px-4 py-3 mb-3 bg-[#fff8e6] border border-[#f0b429] rounded-xl text-sm text-[#1a1a1a]">
            <span>⚠️</span>
            <span>{limitMessage}</span>
            <a href="/#pricing" className="ml-auto font-semibold underline decoration-[#f0b429] underline-offset-2 hover:text-[#f0b429] whitespace-nowrap">Upgrade</a>
          </div>
        )}

        <button
          onClick={handleRoast}
          disabled={!input.trim()}
          className="w-full py-4 bg-[#f0b429] border-2 border-[#1c1c1c] rounded-xl font-bold text-[#1a1a1a] text-base hover:brightness-95 transition-all disabled:opacity-40 mb-4"
        >
          Roast My Prompt{credits !== null ? ` (${credits} left)` : ''}
        </button>

        {result && (
          <div className="space-y-4">
            <div className={`flex items-center justify-between px-5 py-4 rounded-xl border ${overallBadgeStyle(result.overallScore)}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-0.5">Overall Score</p>
                <p className="text-sm font-medium">{result.verdict}</p>
              </div>
              <span className="text-4xl font-black tabular-nums">{result.overallScore}<span className="text-lg font-normal opacity-50">/10</span></span>
            </div>

            <div className="border border-[#c8c0a8] rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-[#e4dfc8] border-b border-[#c8c0a8]">
                <span className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider">Dimension Scores</span>
              </div>
              <div className="divide-y divide-[#e4dfc8]">
                {result.dimensions.map(dim => (
                  <div key={dim.name} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-[#1a1a1a]">{dim.name}</span>
                      <span className={`text-sm font-bold tabular-nums ${scoreLabel(dim.score)}`}>{dim.score}/10</span>
                    </div>
                    <div className="h-1.5 bg-[#e4dfc8] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${scoreColor(dim.score)}`}
                        style={{ width: `${dim.score * 10}%` }}
                      />
                    </div>
                    {dim.issue && <p className="text-xs text-[#9a9080] mt-1.5">{dim.issue}</p>}
                  </div>
                ))}
              </div>
            </div>

            {issues.length > 0 && (
              <div className="border border-[#c8c0a8] rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-[#e4dfc8] border-b border-[#c8c0a8]">
                  <span className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider">Fixes</span>
                </div>
                <div className="divide-y divide-[#e4dfc8]">
                  {issues.map(dim => (
                    <div key={dim.name} className="px-4 py-3 flex gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#f0b429] mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-[#1a1a1a]">{dim.name}: </span>
                        <span className="text-xs text-[#6b6559]">{dim.fix}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.rewrittenPrompt && (
              <div className="border border-[#c8c0a8] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-[#e4dfc8] border-b border-[#c8c0a8]">
                  <span className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider">Improved Version</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-[#1a1a1a] hover:text-[#f0b429] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="px-4 py-4 bg-white font-mono text-xs text-[#1a1a1a] whitespace-pre-wrap leading-relaxed">
                  {result.rewrittenPrompt}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
