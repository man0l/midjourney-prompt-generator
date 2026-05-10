import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { useCredits } from '../hooks/useCredits';
import { AuthModal } from '../components/AuthModal';

interface Props {
  seoTitle: string;
  seoDescription: string;
  inputPlaceholder: string;
  buttonLabel: string;
  toolType: string;
}

export default function SimplePromptTool({ seoTitle, seoDescription, inputPlaceholder, buttonLabel, toolType }: Props) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleGenerate = async () => {
    if (!input.trim()) return;
    if (!session) { setIsAuthModalOpen(true); return; }
    if (credits === 0) {
      showLimit(plan === 'free'
        ? "You've used all your free credits for today. They reset tomorrow."
        : "You've used all your credits for this month. They reset on the 1st.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ prompt: input, toolType }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const success = await useCredit();
      if (success) setOutput(data.optimized || input);
    } catch (err: any) {
      showLimit(err?.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} />
      <div className="px-6 py-8 animate-fade-in">
        <div className="relative mb-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={inputPlaceholder}
            className="w-full min-h-[200px] px-4 py-4 bg-white border border-[#c8c0a8] rounded-xl text-[#1a1a1a] placeholder-[#9a9080] resize-none focus:outline-none focus:border-[#f0b429] transition-colors text-sm"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[#9a9080] text-xs">
            <Sparkles className="w-3 h-3" /> AI-Powered
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
          onClick={handleGenerate}
          disabled={!input.trim() || isGenerating}
          className="w-full py-4 bg-[#f0b429] border-2 border-[#1c1c1c] rounded-xl font-bold text-[#1a1a1a] text-base hover:brightness-95 transition-all disabled:opacity-40 mb-4 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
          ) : null}
          {isGenerating ? 'Generating...' : `${buttonLabel}${credits !== null ? ` (${credits} left)` : ''}`}
        </button>

        {output && (
          <div className="border border-[#c8c0a8] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#e4dfc8] border-b border-[#c8c0a8]">
              <span className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider">Result</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-[#1a1a1a] hover:text-[#f0b429] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="px-4 py-4 bg-white font-mono text-xs text-[#1a1a1a] whitespace-pre-wrap leading-relaxed">
              {output}
            </div>
          </div>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
