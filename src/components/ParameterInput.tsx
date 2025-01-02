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

  const inputClasses = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-text text-sm transition-colors hover:border-white/20";

  return (
    <div className="w-full relative group">
      {tooltip && (
        <div className="absolute right-2 top-2 z-10">
          <HelpCircle className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
          <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-2 text-xs bg-[#1e1b4b] border border-white/10 rounded-md shadow-lg">
            {tooltip}
          </div>
        </div>
      )}
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClasses}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#1e1b4b] text-text">
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={type === 'number' ? `0 to ${constraints?.max || '100'}` : 'Enter value...'}
          min={constraints?.min}
          max={constraints?.max}
          className={inputClasses}
        />
      )}
    </div>
  );
}