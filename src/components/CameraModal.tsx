import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { CAMERA_OPTIONS } from '../constants/cameraOptions';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: (camera: string) => void;
}

export function CameraModal({ isOpen, onClose, onSelectCamera }: CameraModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCamera = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return CAMERA_OPTIONS.filter(
      camera =>
        camera.name.toLowerCase().includes(query) ||
        camera.description.toLowerCase().includes(query) ||
        camera.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background-start/95 backdrop-blur-glass border border-accent/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-accent/20 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-text">Camera Options</h2>
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
              placeholder="Search camera options..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-accent/20 rounded-md text-text 
                placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {filteredCamera.map((camera) => (
            <div
              key={camera.name}
              className="group relative bg-white/5 border border-accent/20 rounded-lg overflow-hidden 
                hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => {
                onSelectCamera(camera.name);
                onClose();
              }}
            >
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={camera.previewUrl}
                  alt={camera.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-text mb-1">{camera.name}</h3>
                <p className="text-sm text-text/70">{camera.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {camera.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-text/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 