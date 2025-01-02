import React, { useState, useCallback } from 'react';
import { 
  Upload,
  Sparkles,
  Palette,
  Lightbulb,
  Camera,
  Brush,
  Shapes,
  Users
} from 'lucide-react';
import { ParameterGrid } from './components/ParameterGrid';
import { generatePrompt } from './utils/promptGenerator';
import { StylesModal } from './components/StylesModal';
import { LightingModal } from './components/LightingModal';
import { CameraModal } from './components/CameraModal';
import { ColorModal } from './components/ColorModal';
import { MaterialsModal } from './components/MaterialsModal';
import { ArtistsModal } from './components/ArtistsModal';

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

  const fullPrompt = generatePrompt(mainPrompt, parameters);

  const handleParameterChange = useCallback((key: keyof typeof parameters, value: string) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPrompt);
  };

  const handleOptimize = () => {
    // Implement optimize prompt
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
            className="px-6 py-2 bg-[#00C853] hover:bg-[#009624] text-white rounded-md 
            transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Optimize Prompt
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
          <button className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600/80 backdrop-blur-glass text-text rounded-md 
            hover:bg-emerald-600 transition-all transform hover:scale-105 border border-accent/20">
            <Upload className="w-5 h-5 mr-2" />
            Upload Inspirational Image
          </button>

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

      <div className="prose max-w-3xl mx-auto text-text">
        <h2 className="text-text">How to Use the Midjourney Prompt Generator</h2>
        <p className="text-text/90">
          Midjourney's AI-powered image generation bot is incredibly powerful. But unless you have a photographic memory,
          it can be really hard to remember all of the parameters and styling options the Midjourney bot supports!
          That's where this prompt helper comes in handy.
        </p>
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
    </div>
  );
}