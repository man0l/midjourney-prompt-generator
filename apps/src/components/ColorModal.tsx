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
    return COLOR_OPTIONS.filter(color => color.name.toLowerCase().includes(query));
  }, [searchQuery]);

  const basicColors = useMemo(() => filteredColors.filter(color => color.category === 'basic'), [filteredColors]);
  const extendedColors = useMemo(() => filteredColors.filter(color => color.category === 'extended'), [filteredColors]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#ede9d8] border-2 border-[#1c1c1c] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#c8c0a8] flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#1a1a1a]">Colors</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#e4dfc8] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#1a1a1a]" />
          </button>
        </div>

        <div className="p-4 border-b border-[#c8c0a8]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9080]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search colors..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#c8c0a8] rounded-lg text-[#1a1a1a] placeholder-[#9a9080] focus:outline-none focus:border-[#f0b429] transition-colors text-sm"
            />
          </div>
        </div>

        <div className="p-4 space-y-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold text-[#6b6559] uppercase tracking-wider mb-3">Basic Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {basicColors.map((color) => (
                <div
                  key={color.name}
                  className="group bg-white border border-[#c8c0a8] rounded-lg overflow-hidden hover:border-[#f0b429] transition-all cursor-pointer"
                  onClick={() => { onSelectColor(color.name); onClose(); }}
                >
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={color.previewUrl} alt={color.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-2 text-center">
                    <h3 className="font-medium text-[#1a1a1a] text-sm">{color.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {extendedColors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#6b6559] uppercase tracking-wider mb-3">Extended Colors</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {extendedColors.map((color) => (
                  <div
                    key={color.name}
                    className="group bg-white border border-[#c8c0a8] rounded-lg overflow-hidden hover:border-[#f0b429] transition-all cursor-pointer"
                    onClick={() => { onSelectColor(color.name); onClose(); }}
                  >
                    <div className="aspect-video w-full overflow-hidden">
                      <img src={color.previewUrl} alt={color.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-2 text-center">
                      <h3 className="font-medium text-[#1a1a1a] text-sm">{color.name}</h3>
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
