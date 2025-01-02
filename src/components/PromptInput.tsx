import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  fullPrompt: string;
}

export function PromptInput({ value, onChange, fullPrompt }: PromptInputProps) {
  return (
    <div className="space-y-4">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing your main idea..."
        className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
      <textarea
        value={fullPrompt ? `/imagine prompt: ${fullPrompt}` : ''}
        readOnly
        placeholder="/imagine prompt:"
        className="w-full h-24 p-4 bg-gray-50 border rounded-lg text-gray-600 resize-none"
      />
    </div>
  );
}