export interface ChatGPTImageParameters {
  scene: string;
  style: string;
  mood: string;
  shotType: string;
  lighting: string;
  aspectRatio: string;
  exclude: string;
}

export function generateChatGPTPrompt(mainPrompt: string, parameters: ChatGPTImageParameters): string {
  const parts: string[] = [];

  if (mainPrompt.trim()) parts.push(mainPrompt.trim());
  if (parameters.scene !== '----') parts.push(`set in ${parameters.scene}`);
  if (parameters.style !== '----') parts.push(`${parameters.style} style`);
  if (parameters.mood !== '----') parts.push(`${parameters.mood} atmosphere`);
  if (parameters.lighting !== '----') parts.push(`${parameters.lighting} lighting`);
  if (parameters.shotType !== '----') parts.push(`${parameters.shotType}`);
  if (parameters.aspectRatio !== '----') parts.push(`${parameters.aspectRatio} aspect ratio`);
  if (parameters.exclude) parts.push(`Do not include: ${parameters.exclude}`);

  return parts.filter(Boolean).join(', ');
}
