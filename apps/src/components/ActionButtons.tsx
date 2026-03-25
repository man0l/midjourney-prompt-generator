import React from 'react';
import { Copy, Save, Zap } from 'lucide-react';

interface ActionButtonsProps {
  onCopy: () => void;
  onSave: () => void;
  onOptimize: () => void;
}

export function ActionButtons({ onCopy, onSave, onOptimize }: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-4 justify-center animate-fade-in">
      <button
        onClick={onCopy}
        className="flex items-center px-6 py-2 bg-primary/80 backdrop-blur-glass text-text rounded-md 
        hover:bg-primary transition-all transform hover:scale-105 border border-accent/20"
      >
        <Copy className="w-4 h-4 mr-2" />
        Copy Prompt
      </button>
      <button
        onClick={onSave}
        className="flex items-center px-6 py-2 bg-secondary/80 backdrop-blur-glass text-text rounded-md 
        hover:bg-secondary transition-all transform hover:scale-105 border border-accent/20"
      >
        <Save className="w-4 h-4 mr-2" />
        Save to My Prompts
      </button>
      <button
        onClick={onOptimize}
        className="flex items-center px-6 py-2 bg-accent/20 backdrop-blur-glass text-text rounded-md 
        hover:bg-accent/40 transition-all transform hover:scale-105 border border-accent/20"
      >
        <Zap className="w-4 h-4 mr-2" />
        Optimize
      </button>
    </div>
  );
}