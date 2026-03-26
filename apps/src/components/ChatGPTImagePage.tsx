import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  Palette,
  Lightbulb,
  Camera,
  Brush,
  Shapes,
  Users,
  Check,
  Copy
} from 'lucide-react';
import { generateChatGPTPrompt, type ChatGPTImageParameters } from '../utils/chatgptPromptGenerator';
import { StylesModal } from '../components/StylesModal';
import { LightingModal } from '../components/LightingModal';
import { CameraModal } from '../components/CameraModal';
import { ColorModal } from '../components/ColorModal';
import { MaterialsModal } from '../components/MaterialsModal';
import { ArtistsModal } from '../components/ArtistsModal';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { useCredits } from '../hooks/useCredits';
import { AuthModal } from '../components/AuthModal';
import { optimizePrompt } from '../services/openai';
import { uploadAndAnalyzeImage } from '../services/imageAnalysis';
import SEO from '../components/SEO';

const SCENE_PRESETS = [
  '----', 'Enchanted Forest', 'Minimalist Studio', 'Cozy Cafe', 'Cyberpunk City',
  'Mountain Lake', 'Modern Interior', 'Urban Rooftop', 'Stormy Ocean',
  'Desert Dunes', 'Ancient Ruins', 'Neon Night Market', 'Snowy Cabin',
];

const STYLE_OPTIONS = [
  '----', 'Photorealistic', 'Cinematic', 'Oil Painting', 'Watercolor',
  'Digital Art', 'Illustration', 'Anime', 'Flat Design', '3D Render',
  'Sketch', 'Pixel Art', 'Comic Book', 'Impressionist',
];

const MOOD_OPTIONS = [
  '----', 'Dramatic', 'Dreamy', 'Moody', 'Peaceful', 'Epic',
  'Mysterious', 'Romantic', 'Gritty', 'Whimsical', 'Tense', 'Serene',
];

const SHOT_OPTIONS = [
  '----', 'Close-up portrait', 'Medium shot', 'Wide establishing shot',
  'Aerial overhead view', 'Low angle shot', 'Eye-level shot',
  'Extreme close-up', 'Full body shot', 'Dutch angle', 'Over-the-shoulder shot',
];

const LIGHTING_OPTIONS = [
  '----', 'Golden hour', 'Blue hour', 'Studio softbox', 'Neon glow',
  'Candlelight', 'Harsh midday sun', 'Overcast diffused', 'Rim lighting',
  'Chiaroscuro', 'Bioluminescent', 'Moonlight',
];

const ASPECT_OPTIONS = ['----', '1:1 (square)', '16:9 (landscape)', '9:16 (portrait)', '4:3', '3:2'];

const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 bg-white border border-[#c8c0a8] rounded-lg text-sm text-[#1a1a1a] focus:outline-none focus:border-[#f0b429] transition-colors"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o === '----' ? `Select ${label}` : o}</option>
      ))}
    </select>
  </div>
);

export default function ChatGPTImagePage() {
  const [mainPrompt, setMainPrompt] = useState('');
  const [parameters, setParameters] = useState<ChatGPTImageParameters>({
    scene: '----',
    style: '----',
    mood: '----',
    shotType: '----',
    lighting: '----',
    aspectRatio: '----',
    exclude: '',
  });

  const [isStylesModalOpen, setIsStylesModalOpen] = useState(false);
  const [isLightingModalOpen, setIsLightingModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isMaterialsModalOpen, setIsMaterialsModalOpen] = useState(false);
  const [isArtistsModalOpen, setIsArtistsModalOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { credits, useCredit } = useCredits(session?.user ?? null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeSuccess, setOptimizeSuccess] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const fullPrompt = generateChatGPTPrompt(mainPrompt, parameters);

  const handleParamChange = useCallback(<K extends keyof ChatGPTImageParameters>(
    key: K, value: ChatGPTImageParameters[K]
  ) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOptimize = async () => {
    if (!session) { setIsAuthModalOpen(true); return; }
    if (credits === 0) { alert('You have used all your credits for today. Please try again tomorrow!'); return; }
    setIsOptimizing(true);
    setOptimizeSuccess(false);
    try {
      const optimized = await optimizePrompt(mainPrompt);
      const success = await useCredit();
      if (success) {
        setMainPrompt(optimized);
        setOptimizeSuccess(true);
        setTimeout(() => setOptimizeSuccess(false), 2000);
      }
    } catch {
      alert('Failed to optimize prompt. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleStyleSelect = (style: string) => {
    const t = `in ${style} style`;
    setMainPrompt(p => p ? (p.replace(/\bin \w+(?:\s+\w+)* style\b/i, t) === p ? `${p}, ${t}` : p.replace(/\bin \w+(?:\s+\w+)* style\b/i, t)) : t);
  };
  const handleLightingSelect = (l: string) => {
    const t = `with ${l} lighting`;
    setMainPrompt(p => p ? (p.replace(/\bwith \w+(?:\s+\w+)* lighting\b/i, t) === p ? `${p}, ${t}` : p.replace(/\bwith \w+(?:\s+\w+)* lighting\b/i, t)) : t);
  };
  const handleCameraSelect = (c: string) => {
    const t = `${c}`;
    setMainPrompt(p => p ? `${p}, ${t}` : t);
  };
  const handleColorSelect = (c: string) => {
    const t = `in ${c} color palette`;
    setMainPrompt(p => p ? (p.replace(/\bin \w+(?:\s+\w+)* color palette\b/i, t) === p ? `${p}, ${t}` : p.replace(/\bin \w+(?:\s+\w+)* color palette\b/i, t)) : t);
  };
  const handleMaterialSelect = (m: string) => {
    const t = `made of ${m}`;
    setMainPrompt(p => p ? (p.replace(/\bmade of \w+(?:\s+\w+)*\b/i, t) === p ? `${p}, ${t}` : p.replace(/\bmade of \w+(?:\s+\w+)*\b/i, t)) : t);
  };
  const handleArtistSelect = (a: string) => {
    const t = `in the style of ${a}`;
    setMainPrompt(p => p ? (p.replace(/\bin the style of \w+(?:\s+\w+)*\b/i, t) === p ? `${p}, ${t}` : p.replace(/\bin the style of \w+(?:\s+\w+)*\b/i, t)) : t);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!session) { setIsAuthModalOpen(true); return; }
    if (credits === 0) { alert('You have used all your credits for today. Please try again tomorrow!'); return; }
    setIsAnalyzing(true);
    try {
      const description = await uploadAndAnalyzeImage(file);
      const success = await useCredit();
      if (success) { setMainPrompt(description); event.target.value = ''; }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to analyze image. Please try again.');
      event.target.value = '';
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <SEO
        title="ChatGPT Image Prompt Generator"
        description="Generate perfect ChatGPT photo prompts instantly. Free ChatGPT image prompt generator — no sign up needed."
      />
      <div className="p-5 animate-fade-in">

        {/* Prompt Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="md:col-span-3 flex flex-col">
            <label className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider mb-2">Describe Your Subject</label>
            <textarea
              value={mainPrompt}
              onChange={(e) => setMainPrompt(e.target.value)}
              placeholder="e.g. a woman reading a book, a sleek sports car, a dragon perched on a cliff..."
              className="flex-1 min-h-[160px] px-4 py-3 bg-white border border-[#c8c0a8] rounded-xl text-[#1a1a1a] placeholder-[#9a9080] resize-none focus:outline-none focus:border-[#f0b429] transition-colors text-sm"
            />
          </div>

          <div className="md:col-span-2 flex flex-col">
            <label className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider mb-2">Generated Prompt</label>
            <div className="flex-1 px-4 py-3 bg-white border border-[#c8c0a8] rounded-xl font-mono text-xs text-[#1a1a1a] mb-3 min-h-[120px] overflow-auto">
              <div className="text-[#9a9080] mb-1">Paste into ChatGPT, Claude or Gemini:</div>
              <div className="break-words leading-relaxed">{fullPrompt || 'Your ready-to-use image prompt will appear here...'}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#c8c0a8] rounded-lg text-sm text-[#1a1a1a] bg-white hover:bg-[#f5f0e4] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Prompt'}
              </button>
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#c8c0a8] rounded-lg text-sm text-[#1a1a1a] bg-white hover:bg-[#f5f0e4] transition-colors disabled:opacity-60"
              >
                {isOptimizing ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                ) : optimizeSuccess ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isOptimizing ? 'Refining...' : optimizeSuccess ? 'Done!' : 'Refine Prompt'}
              </button>
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div className="bg-[#e4dfc8] border border-[#c8c0a8] rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <SelectField label="Scene" value={parameters.scene} options={SCENE_PRESETS} onChange={v => handleParamChange('scene', v)} />
            <SelectField label="Style" value={parameters.style} options={STYLE_OPTIONS} onChange={v => handleParamChange('style', v)} />
            <SelectField label="Mood" value={parameters.mood} options={MOOD_OPTIONS} onChange={v => handleParamChange('mood', v)} />
            <SelectField label="Shot Type" value={parameters.shotType} options={SHOT_OPTIONS} onChange={v => handleParamChange('shotType', v)} />
            <SelectField label="Lighting" value={parameters.lighting} options={LIGHTING_OPTIONS} onChange={v => handleParamChange('lighting', v)} />
            <SelectField label="Aspect Ratio" value={parameters.aspectRatio} options={ASPECT_OPTIONS} onChange={v => handleParamChange('aspectRatio', v)} />
          </div>
          <div className="mt-3">
            <label className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider">Exclude from image</label>
            <input
              type="text"
              value={parameters.exclude}
              onChange={e => handleParamChange('exclude', e.target.value)}
              placeholder="e.g. text, watermark, blurry..."
              className="mt-1 w-full px-3 py-2 bg-white border border-[#c8c0a8] rounded-lg text-sm text-[#1a1a1a] placeholder-[#9a9080] focus:outline-none focus:border-[#f0b429] transition-colors"
            />
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            { label: 'Styles', icon: Palette, open: () => setIsStylesModalOpen(true) },
            { label: 'Lighting', icon: Lightbulb, open: () => setIsLightingModalOpen(true) },
            { label: 'Camera', icon: Camera, open: () => setIsCameraModalOpen(true) },
            { label: 'Colors', icon: Brush, open: () => setIsColorModalOpen(true) },
            { label: 'Materials', icon: Shapes, open: () => setIsMaterialsModalOpen(true) },
            { label: 'Artists', icon: Users, open: () => setIsArtistsModalOpen(true) },
          ] as const).map(({ label, icon: Icon, open }) => (
            <button
              key={label}
              onClick={open}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#c8c0a8] bg-white text-sm text-[#1a1a1a] hover:border-[#f0b429] transition-colors"
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center justify-center gap-2 py-3 bg-[#f0b429] border-2 border-[#1c1c1c] rounded-xl font-semibold text-[#1a1a1a] hover:brightness-95 transition-all disabled:opacity-60"
          >
            {isOptimizing ? <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isOptimizing ? 'Optimizing...' : `Optimize Prompt${credits !== null ? ` (${credits} left)` : ''}`}
          </button>

          <label className={`flex items-center justify-center gap-2 py-3 bg-[#f0b429] border-2 border-[#1c1c1c] rounded-xl font-semibold text-[#1a1a1a] hover:brightness-95 transition-all cursor-pointer ${isAnalyzing ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isAnalyzing} className="hidden" />
            {isAnalyzing ? <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
            {isAnalyzing ? 'Analyzing...' : 'Upload Inspirational Image'}
          </label>
        </div>

        <div className="text-center mt-3">
          <button
            onClick={() => {
              setMainPrompt('');
              setParameters({ scene: '----', style: '----', mood: '----', shotType: '----', lighting: '----', aspectRatio: '----', exclude: '' });
            }}
            className="text-sm text-[#9a9080] hover:text-[#1a1a1a] transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <StylesModal isOpen={isStylesModalOpen} onClose={() => setIsStylesModalOpen(false)} onSelectStyle={handleStyleSelect} />
      <LightingModal isOpen={isLightingModalOpen} onClose={() => setIsLightingModalOpen(false)} onSelectLighting={handleLightingSelect} />
      <CameraModal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} onSelectCamera={handleCameraSelect} />
      <ColorModal isOpen={isColorModalOpen} onClose={() => setIsColorModalOpen(false)} onSelectColor={handleColorSelect} />
      <MaterialsModal isOpen={isMaterialsModalOpen} onClose={() => setIsMaterialsModalOpen(false)} onSelectMaterial={handleMaterialSelect} />
      <ArtistsModal isOpen={isArtistsModalOpen} onClose={() => setIsArtistsModalOpen(false)} onSelectArtist={handleArtistSelect} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
