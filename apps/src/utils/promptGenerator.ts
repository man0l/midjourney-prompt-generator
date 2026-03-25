interface PromptParameters {
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
}

export function generatePrompt(mainPrompt: string, parameters: PromptParameters): string {
  const parts: string[] = [mainPrompt];

  if (parameters.aspectRatio !== '----') {
    parts.push(`--aspect ${parameters.aspectRatio}`);
  }
  if (parameters.version !== '----') {
    parts.push(`--version ${parameters.version}`);
  }
  if (parameters.quality !== '----') {
    parts.push(`--quality ${parameters.quality}`);
  }
  if (parameters.stylize) {
    parts.push(`--stylize ${parameters.stylize}`);
  }
  if (parameters.chaos) {
    parts.push(`--chaos ${parameters.chaos}`);
  }
  if (parameters.stop) {
    parts.push(`--stop ${parameters.stop}`);
  }
  if (parameters.repeat) {
    parts.push(`--repeat ${parameters.repeat}`);
  }
  if (parameters.weird) {
    parts.push(`--weird ${parameters.weird}`);
  }
  if (parameters.tile !== 'No') {
    parts.push('--tile');
  }
  if (parameters.seed) {
    parts.push(`--seed ${parameters.seed}`);
  }
  if (parameters.exclude) {
    parts.push(`--no ${parameters.exclude}`);
  }

  return parts.filter(Boolean).join(' ');
}