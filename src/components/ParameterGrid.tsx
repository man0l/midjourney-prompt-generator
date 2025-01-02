import React from 'react';
import { 
  RectangleHorizontal,
  Layers,
  Sparkles,
  Palette,
  Shuffle,
  Ban,
  Repeat,
  Wand2,
  LayoutGrid,
  Hash,
  XCircle
} from 'lucide-react';
import { ParameterInput } from './ParameterInput';

interface ParameterGridProps {
  parameters: {
    aspectRatio: string;
    version: string;
    quality: string;
    stylize: string;
    chaos: string;
    stop: string;
    repeat: string;
    weird: string;
    tile: string;
    seed: string;
    exclude: string;
  };
  onParameterChange: (key: keyof Parameters, value: string) => void;
}

type Parameters = ParameterGridProps['parameters'];

export function ParameterGrid({ parameters, onParameterChange }: ParameterGridProps) {
  const parameterConfig = [
    { key: 'aspectRatio', label: 'Aspect Ratio', icon: RectangleHorizontal, type: 'select', options: [
      { value: '----', label: 'Select ratio' },
      { value: '1:1', label: '1:1 Square' },
      { value: '16:9', label: '16:9 Landscape' },
      { value: '9:16', label: '9:16 Portrait' },
    ]},
    { key: 'version', label: 'Version', icon: Layers, type: 'select', options: [
      { value: '----', label: 'Select version' },
      { value: 'V6', label: 'Version 6' },
      { value: 'V5.2', label: 'Version 5.2' },
      { value: 'V5.1', label: 'Version 5.1' },
    ]},
    { key: 'quality', label: 'Quality', icon: Sparkles, type: 'select', options: [
      { value: '----', label: 'Select quality' },
      { value: '.25', label: 'Draft (.25)' },
      { value: '.5', label: 'Low (.5)' },
      { value: '1', label: 'Default (1)' },
      { value: '2', label: 'High (2)' },
    ]},
    { key: 'stylize', label: 'Stylize', icon: Palette, type: 'number' },
    { key: 'chaos', label: 'Chaos', icon: Shuffle, type: 'number' },
    { key: 'stop', label: 'Stop', icon: Ban, type: 'number' },
    { key: 'repeat', label: 'Repeat', icon: Repeat, type: 'number' },
    { key: 'weird', label: 'Weird', icon: Wand2, type: 'number' },
    { key: 'tile', label: 'Tile', icon: LayoutGrid, type: 'select', options: [
      { value: 'No', label: 'No' },
      { value: 'Yes', label: 'Yes' },
    ]},
    { key: 'seed', label: 'Seed', icon: Hash, type: 'number' },
    { key: 'exclude', label: 'Exclude', icon: XCircle, type: 'text' },
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
      {parameterConfig.map(({ key, label, icon: Icon, type, options }) => (
        <div key={key} className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-accent/60" />
            <span className="text-sm text-text/80">{label}</span>
          </div>
          <ParameterInput
            label={label}
            value={parameters[key as keyof Parameters]}
            onChange={(value) => onParameterChange(key as keyof Parameters, value)}
            parameterKey={key}
            type={type}
            options={options}
          />
        </div>
      ))}
    </div>
  );
}