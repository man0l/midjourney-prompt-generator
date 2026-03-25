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
  Check
} from 'lucide-react';
import { ParameterGrid } from '../components/ParameterGrid';
import { generatePrompt } from '../utils/promptGenerator';
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

export default function HomePage() {
  const [mainPrompt, setMainPrompt] = useState('');
  const [parameters, setParameters] = useState({
    aspectRatio: '----',
    version: '----',
    quality: '----',
    stylize: '',
    chaos: '',
    stop: '',
    repeat: '',
    weird: '',
    tile: 'No',
    seed: '',
    exclude: ''
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

  useEffect(() => {
    // Initialize session state
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setIsAuthModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fullPrompt = generatePrompt(mainPrompt, parameters);

  const handleParameterChange = useCallback((key: keyof typeof parameters, value: string) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt);
  };

  const handleOptimize = async () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    if (credits === 0) {
      alert('You have used all your credits for today. Please try again tomorrow!');
      return;
    }

    setIsOptimizing(true);
    setOptimizeSuccess(false);

    try {
      const optimizedPrompt = await optimizePrompt(mainPrompt);
      const success = await useCredit();
      
      if (success) {
        setMainPrompt(optimizedPrompt);
        setOptimizeSuccess(true);
        setTimeout(() => setOptimizeSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      alert('Failed to optimize prompt. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleStyleSelect = (style: string) => {
    const currentPrompt = mainPrompt.trim();
    const styleText = `in ${style} style`;
    
    const styleRegex = /\bin \w+(?:\s+\w+)* style\b/i;
    const updatedPrompt = currentPrompt.replace(styleRegex, styleText);
    
    if (updatedPrompt === currentPrompt) {
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${styleText}` : styleText);
    } else {
      setMainPrompt(updatedPrompt);
    }
  };

  const handleLightingSelect = (lighting: string) => {
    const currentPrompt = mainPrompt.trim();
    const lightingText = `with ${lighting} lighting`;
    
    const lightingRegex = /\bwith \w+(?:\s+\w+)* lighting\b/i;
    const updatedPrompt = currentPrompt.replace(lightingRegex, lightingText);
    
    if (updatedPrompt === currentPrompt) {
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${lightingText}` : lightingText);
    } else {
      setMainPrompt(updatedPrompt);
    }
  };

  const handleCameraSelect = (camera: string) => {
    const currentPrompt = mainPrompt.trim();
    const cameraText = `shot with ${camera}`;
    
    const cameraRegex = /\bshot with \w+(?:\s+\w+)*\b/i;
    const updatedPrompt = currentPrompt.replace(cameraRegex, cameraText);
    
    if (updatedPrompt === currentPrompt) {
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${cameraText}` : cameraText);
    } else {
      setMainPrompt(updatedPrompt);
    }
  };

  const handleColorSelect = (color: string) => {
    const currentPrompt = mainPrompt.trim();
    const colorText = `in ${color} color`;
    
    const colorRegex = /\bin \w+(?:\s+\w+)* color\b/i;
    const updatedPrompt = currentPrompt.replace(colorRegex, colorText);
    
    if (updatedPrompt === currentPrompt) {
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${colorText}` : colorText);
    } else {
      setMainPrompt(updatedPrompt);
    }
  };

  const handleMaterialSelect = (material: string) => {
    const currentPrompt = mainPrompt.trim();
    const materialText = `made of ${material}`;
    
    const materialRegex = /\bmade of \w+(?:\s+\w+)*\b/i;
    const updatedPrompt = currentPrompt.replace(materialRegex, materialText);
    
    if (updatedPrompt === currentPrompt) {
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${materialText}` : materialText);
    } else {
      setMainPrompt(updatedPrompt);
    }
  };

  const handleArtistSelect = (artist: string) => {
    const currentPrompt = mainPrompt.trim();
    const artistText = `in the style of ${artist}`;
    
    const artistRegex = /\bin the style of \w+(?:\s+\w+)*\b/i;
    const updatedPrompt = currentPrompt.replace(artistRegex, artistText);
    
    if (updatedPrompt === currentPrompt) {
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${artistText}` : artistText);
    } else {
      setMainPrompt(updatedPrompt);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    if (credits === 0) {
      alert('You have used all your credits for today. Please try again tomorrow!');
      return;
    }

    setIsAnalyzing(true);

    try {
      const description = await uploadAndAnalyzeImage(file);
      const success = await useCredit();
      
      if (success) {
        setMainPrompt(description);
        event.target.value = '';
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Failed to analyze image. Please try again with a different image.');
      }
      event.target.value = '';
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Listen for Sign In event from Header
  useEffect(() => {
    const handler = () => setIsAuthModalOpen(true);
    window.addEventListener('openAuthModal', handler);
    return () => window.removeEventListener('openAuthModal', handler);
  }, []);

  return (
    <>
      <SEO
        title="AI Art Generator"
        description="Create stunning AI art with our Midjourney Prompt Generator."
      />
      <div className="p-5 animate-fade-in">

        {/* Prompt Section — two columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Initial Idea */}
          <div className="md:col-span-3 flex flex-col">
            <label className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider mb-2">Initial Idea</label>
            <textarea
              value={mainPrompt}
              onChange={(e) => setMainPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="flex-1 min-h-[160px] px-4 py-3 bg-white border border-[#c8c0a8] rounded-xl text-[#1a1a1a] placeholder-[#9a9080] resize-none focus:outline-none focus:border-[#f0b429] transition-colors text-sm"
            />
          </div>

          {/* Generated Prompt */}
          <div className="md:col-span-2 flex flex-col">
            <label className="text-xs font-semibold text-[#6b6559] uppercase tracking-wider mb-2">Generated Prompt</label>
            <div className="flex-1 px-4 py-3 bg-white border border-[#c8c0a8] rounded-xl font-mono text-xs text-[#1a1a1a] mb-3 min-h-[120px] overflow-auto">
              <div className="text-[#9a9080] mb-1">/imagine prompt:</div>
              <div className="break-words leading-relaxed">{fullPrompt || 'Your refined prompt will appear here...'}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#c8c0a8] rounded-lg text-sm text-[#1a1a1a] bg-white hover:bg-[#f5f0e4] transition-colors"
              >
                <Upload className="w-3.5 h-3.5 rotate-180" /> Copy Prompt
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

        {/* Parameters Card */}
        <div className="bg-[#e4dfc8] border border-[#c8c0a8] rounded-xl p-4 mb-4">
          <ParameterGrid parameters={parameters} onParameterChange={handleParameterChange} />
        </div>

        {/* Quick Access Buttons Row */}
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
            {isOptimizing ? (
              <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isOptimizing ? 'Optimizing...' : `Optimize Prompt${credits !== null ? ` (${credits} left)` : ''}`}
          </button>

          <label className={`flex items-center justify-center gap-2 py-3 bg-[#f0b429] border-2 border-[#1c1c1c] rounded-xl font-semibold text-[#1a1a1a] hover:brightness-95 transition-all cursor-pointer ${isAnalyzing ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isAnalyzing} className="hidden" />
            {isAnalyzing ? (
              <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Upload Inspirational Image'}
          </label>
        </div>

        <div className="text-center mt-3">
          <button
            onClick={() => {
              setMainPrompt('');
              setParameters({ aspectRatio: '----', version: '----', quality: '----', stylize: '', chaos: '', stop: '', repeat: '', weird: '', tile: 'No', seed: '', exclude: '' });
            }}
            className="text-sm text-[#9a9080] hover:text-[#1a1a1a] transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Modals */}
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