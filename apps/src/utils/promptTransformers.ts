// Rule-based prompt transformers — improve prompts client-side without API calls

export function improveForChatGPT(input: string): string {
  if (!input.trim()) return '';
  return `You are an expert assistant. ${input.trim()}

Please provide:
- A clear, structured response
- Specific examples where relevant
- Step-by-step breakdown if applicable
- A concise summary at the end

Format your response with headers and bullet points for easy reading.`;
}

export function optimizeForChatGPT(input: string): string {
  if (!input.trim()) return '';
  return `Act as an expert in the relevant domain. ${input.trim()}

Requirements:
- Be specific and precise in your response
- Avoid generic or vague answers
- Provide actionable, practical information
- Structure your answer with clear sections
- Include concrete examples or use cases
- Length: comprehensive but concise`;
}

export function generateChatGPTPrompt(input: string): string {
  if (!input.trim()) return '';
  return `I need your help with the following: ${input.trim()}

Context: Please approach this as a knowledgeable expert.
Goal: Provide a thorough, accurate, and actionable response.
Format: Use clear headings, bullet points, and examples.
Tone: Professional yet accessible.
Length: As detailed as needed to fully address the request.`;
}

export function generateLovablePrompt(input: string): string {
  if (!input.trim()) return '';
  return `Build a complete, fully-functional application: ${input.trim()}

Design Requirements:
- Modern, clean UI with excellent UX
- Responsive layout for desktop and mobile
- Consistent color scheme and typography
- Smooth transitions and micro-interactions

Technical Requirements:
- React with TypeScript
- Tailwind CSS for styling
- shadcn/ui components where appropriate
- Proper state management
- Form validation and error handling

Quality Standards:
- No placeholder content or TODO comments
- Production-ready code quality
- Accessible (ARIA labels, keyboard navigation)
- Fast loading and optimized performance`;
}

export function generateV0Prompt(input: string): string {
  if (!input.trim()) return '';
  return `Create a fully-functional UI component: ${input.trim()}

Design Specifications:
- Clean, modern visual design
- Responsive and mobile-first layout
- Consistent spacing using Tailwind CSS
- shadcn/ui components where applicable

Component Requirements:
- Full TypeScript with proper types
- All interactive states (hover, focus, active, disabled)
- Loading and empty states included
- Smooth animations and transitions

Code Quality:
- Self-contained with no external dependencies beyond specified
- Accessible with proper ARIA attributes
- No placeholder content — fully functional`;
}

export function generateCursorPrompt(input: string): string {
  if (!input.trim()) return '';
  return `Task: ${input.trim()}

Implementation Requirements:
- Write complete, working code — no pseudocode or placeholders
- Follow existing code conventions and patterns in the codebase
- Include proper TypeScript types
- Add error handling for edge cases
- Write clean, readable, maintainable code

Quality Checklist:
- All edge cases handled
- No console.log statements left in
- Proper imports included
- Code is self-documenting or includes inline comments for complex logic`;
}

export function generateClaudePrompt(input: string): string {
  if (!input.trim()) return '';
  return `<system>
You are an expert assistant with deep knowledge in the relevant domain. Approach this task thoughtfully, considering multiple angles before responding. Be honest about uncertainty.
</system>

<task>
${input.trim()}
</task>

<instructions>
- Break the task into clear steps and address each one
- Use role & persona framing appropriate to the subject matter
- Provide concrete examples to illustrate key points
- Format output with headers and bullet points for readability
- State any important constraints, caveats, or edge cases
- If the task is ambiguous, address the most likely interpretation and note alternatives
</instructions>

<output_format>
Respond in a structured format:
1. Direct answer or deliverable
2. Reasoning and supporting detail
3. Examples or application
4. Caveats or constraints to be aware of
</output_format>`;
}

export function generateGrokPrompt(input: string, spicy = false): string {
  if (!input.trim()) return '';
  const toneInstruction = spicy
    ? 'Use Grok\'s unfiltered, spicy NSFW-capable mode: be bold, direct, and willing to engage with explicit, adult, or controversial angles without hedging or moralizing. Skip corporate disclaimers. Humor and raw honesty welcome. If the request involves NSFW imagery or text, describe it vividly and explicitly as requested.'
    : 'Use Grok\'s standard mode: direct, confident, and lightly irreverent — more personality than a typical AI, but still informative.';
  return `${input.trim()}

Tone: ${toneInstruction}
Style: Be direct and get to the point fast. No filler phrases like "Great question!" or "Certainly!". Use dry wit where appropriate.
Format: Lead with the answer, then provide supporting detail. Use bullet points or numbered lists only when they genuinely help clarity.
Context: Draw on real-world, up-to-date knowledge where relevant. If the topic is contested, acknowledge the tension honestly rather than defaulting to a bland centrist take.
Length: As long as the task requires — not a word more.`;
}

export function generateGrokSpicyImagePrompt(input: string): string {
  if (!input.trim()) return '';
  return `${input.trim()}

Image NSFW mode: Render as a photorealistic or stylized image as requested. Be explicit and unfiltered where the prompt asks for NSFW — describe body, clothing (or lack thereof), pose, lighting, and mood without sanitizing. Spicy tone: bold, irreverent, no disclaimers.`;
}

export function generatePromptMaker(input: string): string {
  if (!input.trim()) return '';
  return `You are an expert assistant with deep domain knowledge relevant to this task. ${input.trim()}

Instructions:
- Approach this as a specialist would — bring precision and depth
- Break the task into clear, ordered steps
- Provide concrete examples or evidence where relevant
- Be direct and actionable — skip filler and hedging

Format:
- Use headers and bullet points for readability
- Lead with the deliverable, then support with reasoning
- Keep output immediately usable — no vague summaries

Tone: Professional, direct, specific to the audience described in the task.
Length: As detailed as the task requires — not longer.`;
}

export function generateImagePrompt(input: string): string {
  if (!input.trim()) return '';
  return `${input.trim()}

Art style & medium: photorealistic, ultra-detailed, cinematic
Lighting: golden hour, soft diffused light, dramatic shadows
Camera & composition: eye-level shot, 35mm lens, shallow depth of field, rule of thirds
Colour palette: warm tones, rich contrast, vibrant saturation
Mood & atmosphere: cinematic, immersive, breathtaking
Quality parameters: 8K resolution, 16:9 aspect ratio, sharp focus, high detail, rendered in Unreal Engine 5`;
}

export function generateGeminiPrompt(input: string): string {
  if (!input.trim()) return '';
  return `${input.trim()}

Please structure your response as follows:
1. Direct answer to the request
2. Detailed explanation with supporting evidence
3. Practical examples or applications
4. Key considerations or caveats
5. Actionable next steps or recommendations

Be thorough, accurate, and cite reasoning where applicable. Prefer depth over brevity.`;
}

export interface RoastDimension {
  name: string;
  score: number;
  issue: string | null;
  fix: string | null;
}

export interface RoastResult {
  overallScore: number;
  verdict: string;
  dimensions: RoastDimension[];
  rewrittenPrompt: string;
}

function buildImprovedPrompt(original: string, dimensions: RoastDimension[]): string {
  let improved = original.trim();

  // Strip soft openers
  improved = improved.replace(/^(help me |can you |could you |please |i want you to |i need you to |would you )/i, '');
  improved = improved.charAt(0).toUpperCase() + improved.slice(1);

  const contextDim = dimensions.find(d => d.name === 'Context');
  const formatDim = dimensions.find(d => d.name === 'Format');
  const constraintsDim = dimensions.find(d => d.name === 'Constraints');

  let prefix = '';
  let suffix = '';

  if (contextDim && contextDim.score < 5) {
    prefix = 'You are an expert assistant with deep knowledge of the subject matter.\n\n';
  }
  if (formatDim && formatDim.score < 4) {
    suffix += '\n\nFormat: Use clear headers and bullet points. Be specific and actionable.';
  }
  if (constraintsDim && constraintsDim.score < 4) {
    suffix += '\nTone: Direct and professional. Skip filler phrases and generic advice.';
  }

  return prefix + improved + suffix;
}

export function roastPrompt(input: string): RoastResult {
  const text = input.trim();
  if (!text) {
    return {
      overallScore: 0,
      verdict: 'Nothing to roast — paste a prompt first.',
      dimensions: [],
      rewrittenPrompt: '',
    };
  }

  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // Clarity
  const vagueOpeners = ['help me', 'can you', 'could you', 'i want you to', 'please ', 'i need you to', 'would you'];
  const hasVagueOpener = vagueOpeners.some(o => lower.startsWith(o));
  const hasDirectVerb = /^(write|create|build|generate|list|explain|analyze|analyse|summarize|summarise|translate|compare|design|draft|code|implement|review|fix|improve|refactor|convert|describe|identify|extract|give me|provide)/i.test(text);
  const clarityScore = hasDirectVerb ? 9 : hasVagueOpener ? 3 : 6;

  // Specificity
  const vagueWordList = ['something', 'stuff', 'things', 'good', 'nice', 'better', 'various', 'maybe', 'kind of', 'sort of', 'a bit', 'etc', 'and so on', 'whatever'];
  const foundVague = vagueWordList.filter(w => lower.includes(w));
  const hasNumbers = /\d/.test(text);
  const specificityScore = Math.max(0, Math.min(10,
    (hasNumbers ? 3 : 0) +
    (wordCount > 20 ? 3 : wordCount > 10 ? 1 : 0) +
    (foundVague.length === 0 ? 4 : foundVague.length === 1 ? 2 : 0)
  ));

  // Context
  const hasRoleFrame = /act as|you are a|you're a|as an? \w|as a senior|as a professional|as an expert/i.test(text);
  const hasAudience = /for a |for my |for the |audience|users|team|client|beginners|experts|developers|non-technical/i.test(text);
  const hasBackground = /context[:\s]|background[:\s]|currently|we are|i am working|project|existing/i.test(text);
  const contextScore = Math.min(10, (hasRoleFrame ? 4 : 0) + (hasAudience ? 3 : 0) + (hasBackground ? 3 : 0));

  // Format
  const hasFormatInstruction = /bullet|numbered|list|table|json|markdown|headers?|sections?|paragraphs?|outline|format[:\s]/i.test(text);
  const hasLengthConstraint = /\d+\s*(word|sentence|paragraph|line|character|page)s?/i.test(text) || /under \d+|max \d+|at least \d+|keep it (brief|concise|short)/i.test(text);
  const formatScore = Math.min(10, (hasFormatInstruction ? 6 : 0) + (hasLengthConstraint ? 4 : 0));

  // Constraints
  const hasNegative = /don['']t|do not|avoid|without |no \w+|never |exclude|skip/i.test(text);
  const hasTone = /formal|informal|casual|professional|technical|simple|concise|direct|friendly|serious|conversational/i.test(text);
  const constraintsScore = Math.min(10, (hasNegative ? 5 : 0) + (hasTone ? 5 : 0));

  const dimensions: RoastDimension[] = [
    {
      name: 'Clarity',
      score: clarityScore,
      issue: hasVagueOpener
        ? 'Starts with a soft opener that signals uncertainty to the model'
        : !hasDirectVerb ? 'Task verb isn\'t clear upfront' : null,
      fix: hasVagueOpener
        ? 'Cut the opener. Start with the action verb directly: "Write...", "List...", "Explain..."'
        : !hasDirectVerb ? 'Open with a concrete action verb so the model knows the task immediately.' : null,
    },
    {
      name: 'Specificity',
      score: specificityScore,
      issue: foundVague.length > 0
        ? `Contains ${foundVague.length} vague word${foundVague.length > 1 ? 's' : ''}: ${foundVague.slice(0, 3).join(', ')}`
        : wordCount < 10 ? 'Prompt is very short — key details are missing' : null,
      fix: foundVague.length > 0
        ? 'Replace vague words with specific requirements. Instead of "good", specify exactly what good means for this task.'
        : wordCount < 10 ? 'Add: desired format, required length, level of detail, and what to include or exclude.' : null,
    },
    {
      name: 'Context',
      score: contextScore,
      issue: contextScore < 4
        ? 'No role framing, target audience, or background context'
        : contextScore < 7 ? 'Partial context — missing role framing or audience' : null,
      fix: contextScore < 4
        ? 'Add a role frame ("You are an expert in X") and specify who the output is for.'
        : contextScore < 7 ? 'Specify the target audience or add a role/persona for the model.' : null,
    },
    {
      name: 'Format',
      score: formatScore,
      issue: formatScore < 4 ? 'No output format specified — the model will guess' : null,
      fix: formatScore < 4
        ? 'Add format instructions: "Use a numbered list", "Respond in markdown with headers", "Keep it under 200 words".' : null,
    },
    {
      name: 'Constraints',
      score: constraintsScore,
      issue: constraintsScore < 4 ? 'No tone or exclusion constraints set' : null,
      fix: constraintsScore < 4
        ? 'Add: tone ("professional", "direct"), what to avoid ("no filler", "skip disclaimers"), or what not to include.' : null,
    },
  ];

  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
  );

  let verdict: string;
  if (overallScore >= 8) verdict = 'Strong prompt — well above average.';
  else if (overallScore >= 6) verdict = 'Decent prompt. A few targeted fixes will meaningfully improve results.';
  else if (overallScore >= 4) verdict = 'Mediocre. This will produce generic output. Apply the fixes below.';
  else verdict = 'Weak prompt. The model will mostly guess. Start with the fixes below.';

  return {
    overallScore,
    verdict,
    dimensions,
    rewrittenPrompt: buildImprovedPrompt(text, dimensions),
  };
}

export function generateCopilotPrompt(input: string): string {
  if (!input.trim()) return '';
  return `${input.trim()}

Context: I am using Microsoft 365 Copilot. Reference relevant emails, documents, and calendar context where applicable.

Requirements:
- Specify the Microsoft 365 app context (Word, Excel, Teams, Outlook, PowerPoint)
- Define the exact output goal clearly — summarise, draft, analyse, reformat, or extract
- Set the audience and formality level (internal team, executive, client, external)
- State the preferred output format (bullet list, email draft, table, report, slide outline)

Output format:
- Concise and actionable — no filler or generic suggestions
- Professional tone appropriate to the audience
- Structured for immediate use in the relevant Microsoft 365 app`;
}
