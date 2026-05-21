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
    const versionMap: Record<string, string> = {
      'V8.1': '8.1', 'V8': '8', 'V7': '7',
      'V6': '6', 'V5.2': '5.2', 'V5.1': '5.1', 'V5': '5', 'V4': '4', 'V3': '3'
    };
    const v = versionMap[parameters.version];
    if (v) parts.push(`--v ${v}`);
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