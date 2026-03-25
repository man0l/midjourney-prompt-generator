import React from 'react';
import { Image, Sun, Camera, Palette, Box, Layers } from 'lucide-react';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );
}

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <QuickAction icon={<Image className="w-4 h-4" />} label="Styles" onClick={() => {}} />
      <QuickAction icon={<Sun className="w-4 h-4" />} label="Lighting" onClick={() => {}} />
      <QuickAction icon={<Camera className="w-4 h-4" />} label="Camera" onClick={() => {}} />
      <QuickAction icon={<Palette className="w-4 h-4" />} label="Colors" onClick={() => {}} />
      <QuickAction icon={<Box className="w-4 h-4" />} label="Materials" onClick={() => {}} />
      <QuickAction icon={<Layers className="w-4 h-4" />} label="Artists" onClick={() => {}} />
    </div>
  );
}