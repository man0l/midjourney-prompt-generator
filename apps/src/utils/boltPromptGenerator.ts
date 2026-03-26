export interface BoltParameters {
  appType: string;
  techStack: string;
  uiFramework: string;
  database: string;
  auth: string;
  styling: string;
}

export function generateBoltPrompt(description: string, params: BoltParameters, features: string): string {
  if (!description.trim()) return '';

  const lines: string[] = [];

  const appLabel = params.appType !== '----' ? params.appType : 'application';
  lines.push(`Build a complete, fully-functional ${appLabel}: ${description.trim()}`);
  lines.push('');

  // Tech specs block
  const techLines: string[] = [];
  if (params.techStack !== '----') techLines.push(`Framework: ${params.techStack}`);
  if (params.uiFramework !== '----') techLines.push(`UI Library: ${params.uiFramework}`);
  if (params.database !== '----') techLines.push(`Database: ${params.database}`);
  if (params.auth !== '----') techLines.push(`Authentication: ${params.auth}`);
  if (params.styling !== '----') techLines.push(`Styling: ${params.styling}`);

  if (techLines.length > 0) {
    lines.push('Tech Stack:');
    techLines.forEach(t => lines.push(`- ${t}`));
    lines.push('');
  }

  // Features block
  if (features.trim()) {
    lines.push('Core Features:');
    features.trim().split('\n').filter(Boolean).forEach(f => {
      lines.push(`- ${f.replace(/^[-•*]\s*/, '')}`);
    });
    lines.push('');
  }

  // Standard quality requirements
  lines.push('Requirements:');
  lines.push('- Fully functional with no placeholder code or TODO comments');
  lines.push('- Responsive design that works on desktop and mobile');
  lines.push('- Clean, modern UI with good UX');
  lines.push('- Proper error handling and loading states');
  lines.push('- Production-ready code quality');

  return lines.join('\n');
}
