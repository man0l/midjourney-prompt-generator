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
    ? 'Use Grok\'s unfiltered, spicy mode: be bold, direct, and willing to engage with edgy or controversial angles without hedging. Skip the corporate disclaimers. Humor is welcome.'
    : 'Use Grok\'s standard mode: direct, confident, and lightly irreverent — more personality than a typical AI, but still informative.';
  return `${input.trim()}

Tone: ${toneInstruction}
Style: Be direct and get to the point fast. No filler phrases like "Great question!" or "Certainly!". Use dry wit where appropriate.
Format: Lead with the answer, then provide supporting detail. Use bullet points or numbered lists only when they genuinely help clarity.
Context: Draw on real-world, up-to-date knowledge where relevant. If the topic is contested, acknowledge the tension honestly rather than defaulting to a bland centrist take.
Length: As long as the task requires — not a word more.`;
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
