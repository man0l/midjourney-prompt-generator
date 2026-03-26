import React, { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import SEO from '../components/SEO';

interface Props {
  seoTitle: string;
  seoDescription: string;
  inputPlaceholder: string;
  buttonLabel: string;
  transform: (input: string) => string;
}

export default function SimplePromptTool({ seoTitle, seoDescription, inputPlaceholder, buttonLabel, transform }: Props) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const result = transform(input);
    setOutput(result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} />
      <div className="p-5 animate-fade-in">
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

        <button
          onClick={handleGenerate}
          disabled={!input.trim()}
          className="w-full py-4 bg-[#f0b429] border-2 border-[#1c1c1c] rounded-xl font-bold text-[#1a1a1a] text-base hover:brightness-95 transition-all disabled:opacity-40 mb-4"
        >
          {buttonLabel}
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
    </>
  );
}
