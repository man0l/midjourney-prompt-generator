export const ASPECT_RATIO_OPTIONS = [
  { value: '----', label: 'Select ratio' },
  { value: '1:1', label: '1:1 Square' },
  { value: '16:9', label: '16:9 Landscape' },
  { value: '9:16', label: '9:16 Portrait' },
  { value: '2:1', label: '2:1 Wide' },
  { value: '1:2', label: '1:2 Tall' }
];

export const VERSION_OPTIONS = [
  { value: '----', label: 'Select version' },
  { value: 'V8.1', label: 'Version 8.1 (latest)' },
  { value: 'V8', label: 'Version 8' },
  { value: 'V7', label: 'Version 7' },
  { value: 'V6', label: 'Version 6' },
  { value: 'V5.2', label: 'Version 5.2' },
  { value: 'V5.1', label: 'Version 5.1' },
  { value: 'V5', label: 'Version 5' },
  { value: 'V4', label: 'Version 4' },
  { value: 'V3', label: 'Version 3' }
];

export const QUALITY_OPTIONS = [
  { value: '----', label: 'Select quality' },
  { value: '1', label: 'Default (1)' },
  { value: '2', label: 'High (2)' }
];

export const PARAMETER_CONSTRAINTS = {
  stylize: { min: 0, max: 1000, placeholder: '0 to 1000' },
  chaos: { min: 0, max: 100, placeholder: '0 to 100' },
  stop: { min: 10, max: 100, placeholder: '10 to 100' },
  repeat: { min: 2, max: 40, placeholder: '2 to 40' },
  weird: { min: 0, max: 3000, placeholder: '0 to 3000' },
  seed: { min: 0, max: 4294967295, placeholder: '0 to 4294967295' }
};

// Tokens that don't increase quality — they pull in noisy training data and can break coherence.
// Source: https://prompt-faqs.notion.site/Troublesome-Tokens
export const TROUBLESOME_TOKENS = [
  // Resolution / display jargon
  '4k', '6k', '8k', '16k', 'ultra 4k', 'hd', 'hdr', 'hdmi', 'ultra hd', 'high-resolution',
  'high resolution', 'dpi', 'ppi', '1080p', '720p', 'display quality', 'retina display', 'crystal clear',
  // Detail buzzwords
  'ultra detailed', 'insanely detailed', 'extreme detail', 'hyper detailed',
  'maximum detail', 'super detailed',
  // Realism buzzwords
  'hyper realistic', 'ultra realistic',
  // Render engines
  'octane render', 'octane', 'unreal engine', 'v-ray', 'lumion', 'renderman',
  'blender render', 'arnold render', 'redshift render', 'cycles render',
  // Lighting jargon (used as fake quality boosters)
  'studio lighting', 'professional lighting', 'volumetric lighting',
  'global illumination', 'ray tracing', 'path tracing',
  // Platform / prestige tags
  'masterpiece', 'award-winning', 'trending', 'trending on artstation', 'artstation',
  'trending on deviantart', 'deviantart', 'behance', 'pinterest',
  'perfect composition', 'best quality', 'highest quality',
];

export const PARAMETER_TOOLTIPS = {
  aspectRatio: 'Set the width-to-height ratio of your generated image. Different ratios are better suited for different types of compositions.',
  version: 'Choose which Midjourney model version to use. Each version has its own unique characteristics and improvements.',
  quality: 'Adjust the rendering quality and generation time. Higher values produce better details but take longer.',
  stylize: 'Control the strength of Midjourney\'s artistic interpretation. Default is 100. Use 50–75 to improve prompt adherence when details go missing. Max is 1000 for most artistic.',
  chaos: 'Add randomness to the image generation. Higher values (0-100) produce more varied and unpredictable results.',
  stop: 'Stop the generation process early (10-100). Lower values create more abstract, less detailed images.',
  repeat: 'Generate multiple variations in one go. Useful for exploring different interpretations (2-40 variations).',
  weird: 'Introduce experimental and unusual elements. Higher values (0-3000) create more surreal and unexpected results.',
  tile: 'Create seamless, repeatable patterns. Perfect for textures, wallpapers, and fabric designs.',
  seed: 'Use the same seed number to maintain consistency across generations with the same prompt.',
  exclude: 'Appends --no to suppress elements (V6/V7). In V8, --no is unavailable — instead describe what you want to see in its place (e.g. a unicorn without a horn is just a horse). Separate multiple items with commas.'
};