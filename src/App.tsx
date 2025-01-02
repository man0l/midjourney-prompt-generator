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
import { ParameterGrid } from './components/ParameterGrid';
import { generatePrompt } from './utils/promptGenerator';
import { StylesModal } from './components/StylesModal';
import { LightingModal } from './components/LightingModal';
import { CameraModal } from './components/CameraModal';
import { ColorModal } from './components/ColorModal';
import { MaterialsModal } from './components/MaterialsModal';
import { ArtistsModal } from './components/ArtistsModal';
import { supabase } from './lib/supabase';
import { AuthUI } from './components/Auth';
import { Session } from '@supabase/supabase-js';
import { useCredits } from './hooks/useCredits';
import { AuthModal } from './components/AuthModal';
import { optimizePrompt } from './services/openai';
import { uploadAndAnalyzeImage } from './services/imageAnalysis';

export default function App() {
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
        setTimeout(() => setOptimizeSuccess(false), 2000); // Hide success after 2 seconds
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
    
    // Check if there's already a style mentioned
    const styleRegex = /\bin \w+(?:\s+\w+)* style\b/i;
    const updatedPrompt = currentPrompt.replace(styleRegex, styleText);
    
    if (updatedPrompt === currentPrompt) {
      // No style was replaced, so append the new style
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${styleText}` : styleText);
    } else {
      // Style was replaced
      setMainPrompt(updatedPrompt);
    }
  };

  const handleLightingSelect = (lighting: string) => {
    const currentPrompt = mainPrompt.trim();
    const lightingText = `with ${lighting} lighting`;
    
    // Check if there's already a lighting mentioned
    const lightingRegex = /\bwith \w+(?:\s+\w+)* lighting\b/i;
    const updatedPrompt = currentPrompt.replace(lightingRegex, lightingText);
    
    if (updatedPrompt === currentPrompt) {
      // No lighting was replaced, so append the new lighting
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${lightingText}` : lightingText);
    } else {
      // Lighting was replaced
      setMainPrompt(updatedPrompt);
    }
  };

  const handleCameraSelect = (camera: string) => {
    const currentPrompt = mainPrompt.trim();
    const cameraText = `shot with ${camera}`;
    
    // Check if there's already a camera mentioned
    const cameraRegex = /\bshot with \w+(?:\s+\w+)*\b/i;
    const updatedPrompt = currentPrompt.replace(cameraRegex, cameraText);
    
    if (updatedPrompt === currentPrompt) {
      // No camera was replaced, so append the new camera
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${cameraText}` : cameraText);
    } else {
      // Camera was replaced
      setMainPrompt(updatedPrompt);
    }
  };

  const handleColorSelect = (color: string) => {
    const currentPrompt = mainPrompt.trim();
    const colorText = `in ${color} color`;
    
    // Check if there's already a color mentioned
    const colorRegex = /\bin \w+(?:\s+\w+)* color\b/i;
    const updatedPrompt = currentPrompt.replace(colorRegex, colorText);
    
    if (updatedPrompt === currentPrompt) {
      // No color was replaced, so append the new color
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${colorText}` : colorText);
    } else {
      // Color was replaced
      setMainPrompt(updatedPrompt);
    }
  };

  const handleMaterialSelect = (material: string) => {
    const currentPrompt = mainPrompt.trim();
    const materialText = `made of ${material}`;
    
    // Check if there's already a material mentioned
    const materialRegex = /\bmade of \w+(?:\s+\w+)*\b/i;
    const updatedPrompt = currentPrompt.replace(materialRegex, materialText);
    
    if (updatedPrompt === currentPrompt) {
      // No material was replaced, so append the new material
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${materialText}` : materialText);
    } else {
      // Material was replaced
      setMainPrompt(updatedPrompt);
    }
  };

  const handleArtistSelect = (artist: string) => {
    const currentPrompt = mainPrompt.trim();
    const artistText = `in the style of ${artist}`;
    
    // Check if there's already an artist mentioned
    const artistRegex = /\bin the style of \w+(?:\s+\w+)*\b/i;
    const updatedPrompt = currentPrompt.replace(artistRegex, artistText);
    
    if (updatedPrompt === currentPrompt) {
      // No artist was replaced, so append the new artist
      setMainPrompt(currentPrompt ? `${currentPrompt}, ${artistText}` : artistText);
    } else {
      // Artist was replaced
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
        // Clear the file input for next use
        event.target.value = '';
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Failed to analyze image. Please try again with a different image.');
      }
      // Clear the file input on error
      event.target.value = '';
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-4xl font-bold text-center mb-8 text-text">Midjourney Prompt Generator</h1>
      
      <div className="bg-background-start/30 backdrop-blur-glass rounded-xl border border-accent/20 p-8 mb-8 shadow-lg">
        {/* Main Prompt Input */}
        <div className="mb-6">
          <textarea
            value={mainPrompt}
            onChange={(e) => setMainPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full h-32 px-4 py-3 bg-background-start/50 backdrop-blur-glass border border-accent/20 rounded-md text-text 
            focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none
            hover:bg-background-start/70"
          />
        </div>

        {/* Generated Prompt Display */}
        <div className="mb-6 font-mono bg-background-end/50 backdrop-blur-glass rounded-md p-4 border border-accent/20">
          <div className="text-accent/80">/imagine prompt:</div>
          <div className="text-text break-all">{fullPrompt || 'Your prompt will appear here...'}</div>
        </div>

        {/* Main Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={handleCopy}
            className="px-6 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md 
            transition-colors"
          >
            Copy Prompt
          </button>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className={`px-6 py-2 ${
              optimizeSuccess 
                ? 'bg-[#00C853] hover:bg-[#00C853]' 
                : 'bg-[#00C853] hover:bg-[#009624]'
            } text-white rounded-md 
            transition-colors flex items-center gap-2 relative ${
              isOptimizing ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isOptimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Optimizing...
              </>
            ) : optimizeSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Optimized!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Optimize Prompt {credits !== null && `(${credits} left for today)`}
              </>
            )}
          </button>
        </div>

        {/* Parameter Grid */}
        <div className="mb-8">
          <ParameterGrid
            parameters={parameters}
            onParameterChange={handleParameterChange}
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button 
            onClick={() => setIsStylesModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-background-end/30 backdrop-blur-glass text-text rounded-md 
            hover:bg-background-end/50 transition-all border border-accent/20"
          >
            <Palette className="w-4 h-4 text-accent" /> Styles
          </button>
          <button 
            onClick={() => setIsLightingModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-background-end/30 backdrop-blur-glass text-text rounded-md 
            hover:bg-background-end/50 transition-all border border-accent/20"
          >
            <Lightbulb className="w-4 h-4 text-accent" /> Lighting
          </button>
          <button 
            onClick={() => setIsCameraModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-background-end/30 backdrop-blur-glass text-text rounded-md 
            hover:bg-background-end/50 transition-all border border-accent/20"
          >
            <Camera className="w-4 h-4 text-accent" /> Camera
          </button>
          <button 
            onClick={() => setIsColorModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-background-end/30 backdrop-blur-glass text-text rounded-md 
            hover:bg-background-end/50 transition-all border border-accent/20"
          >
            <Brush className="w-4 h-4 text-accent" /> Colors
          </button>
          <button 
            onClick={() => setIsMaterialsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-background-end/30 backdrop-blur-glass text-text rounded-md 
            hover:bg-background-end/50 transition-all border border-accent/20"
          >
            <Shapes className="w-4 h-4 text-accent" /> Materials
          </button>
          <button 
            onClick={() => setIsArtistsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-background-end/30 backdrop-blur-glass text-text rounded-md 
            hover:bg-background-end/50 transition-all border border-accent/20"
          >
            <Users className="w-4 h-4 text-accent" /> Artists
          </button>
        </div>

        {/* Upload Button */}
        <div className="flex flex-col gap-4 items-center">
          <label className={`w-full flex items-center justify-center px-4 py-3 bg-emerald-600/80 backdrop-blur-glass text-text rounded-md 
            hover:bg-emerald-600 transition-all transform hover:scale-105 border border-accent/20 cursor-pointer
            ${isAnalyzing ? 'opacity-75 cursor-not-allowed' : ''}`}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isAnalyzing}
              className="hidden"
            />
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Analyzing Image...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload Inspirational Image {credits !== null && `(Uses 1 Credit)`}
              </>
            )}
          </label>

          <button 
            onClick={() => {
              setMainPrompt('');
              setParameters({
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
            }}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="prose max-w-3xl mx-auto space-y-8 px-4">
        <section className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text mb-6">Welcome to the Midjourney Prompt Generator</h2>
          <h3 className="text-xl text-text/90 font-medium">Create Stunning AI Art with Ease</h3>
        </section>

        <section className="bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
          <p className="text-lg text-text/90 leading-relaxed">
            Unleash your creativity and turn ideas into breathtaking art with our Midjourney Prompt Generator. Whether you're a seasoned digital artist or just starting your journey into the world of AI-generated art, our platform empowers you to craft the perfect prompts that bring your visions to life with incredible detail and style.
          </p>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl font-semibold text-text">Why Use Midjourney Prompts?</h3>
          <div className="bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
            <p className="text-text/90 leading-relaxed">
              Midjourney is an innovative and cutting-edge AI image generator that takes your text prompts and converts them into visually captivating artworks. From hyper-realistic portraits to fantastical, dream-like landscapes, the possibilities for creativity are truly limitless.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl font-semibold text-text">What We Offer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <h4 className="font-medium text-text mb-3">Extensive Prompt Library</h4>
              <p className="text-text/90">Explore a rich collection of curated prompts designed to enhance lighting, materials, and photography effects.</p>
            </div>
            <div className="bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <h4 className="font-medium text-text mb-3">Freemium Access</h4>
              <p className="text-text/90">Get started at no cost with essential tools and upgrade for access to advanced features and premium content.</p>
            </div>
            <div className="bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <h4 className="font-medium text-text mb-3">User-Friendly Interface</h4>
              <p className="text-text/90">Simply describe your concept, adjust creative parameters, and let the AI bring your imagination to life.</p>
            </div>
            <div className="bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <h4 className="font-medium text-text mb-3">Templates & Inspiration</h4>
              <p className="text-text/90">Access pre-made templates and expertly crafted prompt examples that spark creativity.</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl font-semibold text-text">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <div className="text-2xl mb-4">🎨</div>
              <h4 className="font-medium text-text mb-2">1. Select a Style</h4>
              <p className="text-text/90">Choose from a vast array of artistic styles, from photorealistic to surreal.</p>
            </div>
            <div className="bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <div className="text-2xl mb-4">✨</div>
              <h4 className="font-medium text-text mb-2">2. Add Details</h4>
              <p className="text-text/90">Fine-tune your image with lighting, textures, and other parameters.</p>
            </div>
            <div className="bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <div className="text-2xl mb-4">🎯</div>
              <h4 className="font-medium text-text mb-2">3. Generate & Refine</h4>
              <p className="text-text/90">Create your image and iterate until it's perfect.</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl font-semibold text-text">Popular Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-4 bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <div className="text-xl">💡</div>
              <div>
                <h4 className="font-medium text-text mb-2">Lighting Control</h4>
                <p className="text-text/90">Design images with precision lighting and dramatic shadows.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <div className="text-xl">🎭</div>
              <div>
                <h4 className="font-medium text-text mb-2">Material Prompts</h4>
                <p className="text-text/90">Incorporate realistic textures and materials in your creations.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <div className="text-xl">📐</div>
              <div>
                <h4 className="font-medium text-text mb-2">Aspect Ratio Control</h4>
                <p className="text-text/90">Customize dimensions to fit any platform or need.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-background-end/10 rounded-xl p-6 backdrop-blur-sm border border-accent/10">
              <div className="text-xl">⚡</div>
              <div>
                <h4 className="font-medium text-text mb-2">Advanced Upscaling</h4>
                <p className="text-text/90">Enhance image quality with powerful upscaling tools.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center bg-background-end/10 rounded-xl p-8 backdrop-blur-sm border border-accent/10">
          <p className="text-lg font-medium text-text">
            Start your AI art journey today and unlock new creative possibilities with Midjourney!
          </p>
        </section>
      </div>

      <StylesModal
        isOpen={isStylesModalOpen}
        onClose={() => setIsStylesModalOpen(false)}
        onSelectStyle={handleStyleSelect}
      />

      <LightingModal
        isOpen={isLightingModalOpen}
        onClose={() => setIsLightingModalOpen(false)}
        onSelectLighting={handleLightingSelect}
      />

      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onSelectCamera={handleCameraSelect}
      />

      <ColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        onSelectColor={handleColorSelect}
      />

      <MaterialsModal
        isOpen={isMaterialsModalOpen}
        onClose={() => setIsMaterialsModalOpen(false)}
        onSelectMaterial={handleMaterialSelect}
      />

      <ArtistsModal
        isOpen={isArtistsModalOpen}
        onClose={() => setIsArtistsModalOpen(false)}
        onSelectArtist={handleArtistSelect}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {session && (
        <button
          onClick={() => supabase.auth.signOut()}
          className="fixed top-4 right-4 px-4 py-2 bg-red-600/80 text-white rounded-md 
            hover:bg-red-600 transition-all"
        >
          Sign Out
        </button>
      )}
    </div>
  );
}