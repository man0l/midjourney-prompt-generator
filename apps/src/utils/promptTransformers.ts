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
