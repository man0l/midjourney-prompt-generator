import React, { useState } from 'react';
import { Copy, Wand2 } from 'lucide-react';

interface PromptSection {
  subject: string;
  style: string;
  lighting: string;
  camera: string;
  artist: string;
  additional: string;
}

export default function PromptBuilder() {
  const [prompt, setPrompt] = useState<PromptSection>({
    subject: '',
    style: '',
    lighting: '',
    camera: '',
    artist: '',
    additional: ''
  });

  const handleChange = (field: keyof PromptSection, value: string) => {
    setPrompt(prev => ({ ...prev, [field]: value }));
  };

  const generatePrompt = () => {
    const parts = [
      prompt.subject,
      prompt.style && `in ${prompt.style} style`,
      prompt.lighting && `with ${prompt.lighting} lighting`,
      prompt.camera && `shot with ${prompt.camera}`,
      prompt.artist && `in the style of ${prompt.artist}`,
      prompt.additional
    ].filter(Boolean);

    return parts.join(', ');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatePrompt());
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Description
          </label>
          <input
            type="text"
            value={prompt.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="A mystical forest with glowing mushrooms"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Art Style
          </label>
          <input
            type="text"
            value={prompt.style}
            onChange={(e) => handleChange('style', e.target.value)}
            placeholder="digital art, watercolor, oil painting"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lighting
          </label>
          <input
            type="text"
            value={prompt.lighting}
            onChange={(e) => handleChange('lighting', e.target.value)}
            placeholder="dramatic, soft, cinematic"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Camera Settings
          </label>
          <input
            type="text"
            value={prompt.camera}
            onChange={(e) => handleChange('camera', e.target.value)}
            placeholder="wide angle lens, macro, telephoto"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Artist Reference
          </label>
          <input
            type="text"
            value={prompt.artist}
            onChange={(e) => handleChange('artist', e.target.value)}
            placeholder="Vincent van Gogh, Studio Ghibli"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Details
          </label>
          <input
            type="text"
            value={prompt.additional}
            onChange={(e) => handleChange('additional', e.target.value)}
            placeholder="8k, highly detailed, masterpiece"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Prompt</h3>
        <p className="text-gray-700 mb-4">{generatePrompt()}</p>
        <button
          onClick={copyToClipboard}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Prompt
        </button>
      </div>
    </div>
  );
}