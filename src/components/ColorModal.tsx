import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { COLOR_OPTIONS } from '../constants/colorOptions';

interface ColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectColor: (color: string) => void;
}

export function ColorModal({ isOpen, onClose, onSelectColor }: ColorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredColors = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return COLOR_OPTIONS.filter(color =>
      color.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const basicColors = useMemo(() => 
    filteredColors.filter(color => color.category === 'basic'),
    [filteredColors]
  );

  const extendedColors = useMemo(() => 
    filteredColors.filter(color => color.category === 'extended'),
    [filteredColors]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background-start/95 backdrop-blur-glass border border-accent/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-accent/20 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-text">Colors</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-text" />
          </button>
        </div>
        
        <div className="p-4 border-b border-accent/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search colors..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-accent/20 rounded-md text-text 
                placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="p-4 space-y-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {/* Basic Colors Section */}
          <div>
            <h3 className="text-lg font-medium text-text/80 mb-3">Basic Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {basicColors.map((color) => (
                <div
                  key={color.name}
                  className="group relative bg-white/5 border border-accent/20 rounded-lg overflow-hidden 
                    hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => {
                    onSelectColor(color.name);
                    onClose();
                  }}
                >
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={color.previewUrl}
                      alt={color.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2 text-center">
                    <h3 className="font-medium text-text">{color.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extended Colors Section */}
          {extendedColors.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-text/80 mb-3">Extended Colors</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {extendedColors.map((color) => (
                  <div
                    key={color.name}
                    className="group relative bg-white/5 border border-accent/20 rounded-lg overflow-hidden 
                      hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => {
                      onSelectColor(color.name);
                      onClose();
                    }}
                  >
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={color.previewUrl}
                        alt={color.name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2 text-center">
                      <h3 className="font-medium text-text">{color.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 