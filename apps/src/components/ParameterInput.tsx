import React from 'react';
import { HelpCircle } from 'lucide-react';
import { PARAMETER_CONSTRAINTS, PARAMETER_TOOLTIPS } from '../constants/parameterOptions';

interface ParameterInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  parameterKey: string;
  type?: 'text' | 'select' | 'number';
  options?: Array<{ value: string; label: string }>;
}

export function ParameterInput({
  value,
  onChange,
  parameterKey,
  type = 'text',
  options = []
}: ParameterInputProps) {
  const constraints = PARAMETER_CONSTRAINTS[parameterKey as keyof typeof PARAMETER_CONSTRAINTS];
  const tooltip = PARAMETER_TOOLTIPS[parameterKey as keyof typeof PARAMETER_TOOLTIPS];
  const isSlider = type === 'number' && constraints?.max && constraints.max <= 3000;

  const baseInput = "w-full px-3 py-2 bg-white border border-[#c8c0a8] rounded-lg text-[#1a1a1a] text-sm focus:outline-none focus:border-[#f0b429] transition-colors";

  return (
    <div className="w-full relative group">
      {tooltip && (
        <div className="absolute right-0 top-0 z-10">
          <HelpCircle className="w-4 h-4 text-[#9a9080] group-hover:text-[#6b6559] transition-colors" />
          <div className="hidden group-hover:block absolute right-0 top-5 w-56 p-2 text-xs bg-[#1c1c1c] text-[#ede9d8] rounded-lg shadow-lg z-20">
            {tooltip}
          </div>
        </div>
      )}

      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : isSlider ? (
        <div className="pt-1 pr-6">
          <input
            type="range"
            min={constraints?.min ?? 0}
            max={constraints?.max ?? 100}
            value={value || (constraints?.min ?? 0)}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : (
        <input
          type={type === 'number' ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={type === 'number' ? `0 to ${constraints?.max || '∞'}` : 'Enter value...'}
          className={baseInput}
        />
      )}
    </div>
  );
}
