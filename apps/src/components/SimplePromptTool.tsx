import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { useCredits } from '../hooks/useCredits';
import { AuthModal } from '../components/AuthModal';
import { useAuthNudge } from '../hooks/useAuthNudge';
import { optimizePrompt, OutOfCreditsError } from '../services/openai';
import { ensureSession } from '../lib/session';

interface Props {
  seoTitle: string;
  seoDescription: string;
  inputPlaceholder: string;
  buttonLabel: string;
  toolType: string;
  showSpicyToggle?: boolean;
}

export default function SimplePromptTool({ seoTitle, seoDescription, inputPlaceholder, buttonLabel, toolType, showSpicyToggle }: Props) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [spicy, setSpicy] = useState(true);
  const [asImage, setAsImage] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const effectiveToolType = (() => {
    if (showSpicyToggle && asImage) return spicy ? 'grok-spicy-image' : 'grok-image';
    if (showSpicyToggle && spicy) return 'grok-spicy';
    return toolType;
  })();
  const [session, setSession] = useState<Session | null>(null);
  const { isOpen: isAuthModalOpen, variant: authVariant, openAuthModal, closeAuthModal, needsSignIn } = useAuthNudge(session);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const { credits, plan, setCredits } = useCredits(session?.user ?? null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) closeAuthModal();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = () => openAuthModal();
    window.addEventListener('openAuthModal', handler);
    return () => window.removeEventListener('openAuthModal', handler);
  }, []);

  function showLimit(msg: string) {
    setLimitMessage(msg);
    setTimeout(() => setLimitMessage(null), 4000);
  }

  const handlePreview = async () => {
    if (!output.trim()) return;
    setIsPreviewing(true);
    setPreviewUrl(null);
    try {
      if (!await ensureSession()) { openAuthModal(); return; }
      if (credits !== null && credits < 2) {
        if (needsSignIn) openAuthModal('limit');
        else showLimit(plan === 'free' ? "You've used your 3 free generations for today. They reset tomorrow." : "Not enough credits for a preview (needs 2). They reset on the 1st.");
        return;
      }
      const { data: { session: sess } } = await supabase.auth.getSession();
      if (!sess) throw new Error('Not authenticated');
      const res = await fetch('/api/grok-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sess.access_token}` },
        body: JSON.stringify({ prompt: output }),
      });
      const data = await res.json();
      if (res.status === 402) throw new OutOfCreditsError();
      if (!res.ok || data.error) throw new Error(data.error || 'Preview failed');
      if (typeof data.creditsRemaining === 'number') setCredits(data.creditsRemaining);
      // Async generation: POST returns 202 with jobId, poll until done (grok-imagine ~70s)
      const jobId: string | undefined = data.jobId;
      if (jobId) {
        let attempts = 0;
        while (attempts < 60) {
          await new Promise(r => setTimeout(r, 3000));
          attempts++;
          const pollRes = await fetch(`/api/grok-preview?id=${encodeURIComponent(jobId)}`, {
            headers: { Authorization: `Bearer ${sess.access_token}` },
          });
          const pollData = await pollRes.json();
          if (pollData.status === 'done') {
            if (pollData.b64_json) setPreviewUrl(`data:image/jpeg;base64,${pollData.b64_json}`);
            else if (pollData.imageUrl) setPreviewUrl(pollData.imageUrl);
            if (typeof pollData.creditsRemaining === 'number') setCredits(pollData.creditsRemaining);
            return;
          }
          if (pollData.status === 'error' || pollRes.status >= 400) throw new Error(pollData.error || 'Preview failed');
        }
        throw new Error('Preview timed out — please try again.');
      }
      // Fallback for direct response (no jobId)
      if (data.b64_json) setPreviewUrl(`data:image/jpeg;base64,${data.b64_json}`);
      else if (data.imageUrl) setPreviewUrl(data.imageUrl);
    } catch (err: any) {
      if (err instanceof OutOfCreditsError) { if (needsSignIn) openAuthModal('limit'); else showLimit("You've used your generations for today. They reset tomorrow."); }
      else showLimit(err?.message || 'Preview failed. Please try again.');
    } finally { setIsPreviewing(false); }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    try {
      if (!await ensureSession()) {
        openAuthModal();
        return;
      }

      const result = await optimizePrompt(input, effectiveToolType);

      if (result.creditsRemaining !== null) setCredits(result.creditsRemaining);
      setOutput(result.optimized || input);
      setPreviewUrl(null);
      if (needsSignIn && result.creditsRemaining === 0) {
        setTimeout(() => openAuthModal('limit'), 700);
      }
    } catch (err: any) {
      if (err instanceof OutOfCreditsError) {
        if (needsSignIn) {
          openAuthModal('limit');
        } else {
          showLimit(plan === 'free'
            ? "You've used your 3 free generations for today. They reset tomorrow."
            : "You've used all your credits for this month. They reset on the 1st.");
        }
      } else {
        showLimit(err?.message || 'Generation failed. Please try again.');
      }
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
            {needsSignIn ? (
              <button
                onClick={() => openAuthModal('limit')}
                className="ml-auto font-semibold underline decoration-[#f0b429] underline-offset-2 hover:text-[#f0b429] whitespace-nowrap"
              >
                Claim 7 free
              </button>
            ) : (
              <a href="/#pricing" className="ml-auto font-semibold underline decoration-[#f0b429] underline-offset-2 hover:text-[#f0b429] whitespace-nowrap">Upgrade</a>
            )}
          </div>
        )}

        {showSpicyToggle && (
          <div className="flex flex-wrap gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={spicy} onChange={e => setSpicy(e.target.checked)} className="w-4 h-4 accent-[#f0b429]" />
              <span className="text-sm font-semibold text-[#1a1a1a]">🌶️ Spicy mode</span>
              <span className="text-xs text-[#6b6559]">always on</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={asImage} onChange={e => setAsImage(e.target.checked)} className="w-4 h-4 accent-[#f0b429]" />
              <span className="text-sm font-semibold text-[#1a1a1a]">🖼️ Image</span>
              <span className="text-xs text-[#6b6559]">describe as image</span>
            </label>
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
          <>
            <div className="flex gap-2 mb-3">
              <button onClick={handlePreview} disabled={!output.trim() || isPreviewing} className="flex-1 py-2.5 bg-[#1a1a1a] border-2 border-[#1c1c1c] rounded-xl font-semibold text-sm text-white hover:bg-black transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {isPreviewing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {isPreviewing ? 'Generating preview…' : 'grok -imagine preview (2 credits)'}
              </button>
            </div>
            {previewUrl && (
              <div className="mb-3 rounded-xl overflow-hidden border-2 border-[#1c1c1c]"><img src={previewUrl} alt="Grok imagine preview" className="w-full" /></div>
            )}
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
          </>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} variant={authVariant} />
    </>
  );
}
