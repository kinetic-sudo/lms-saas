import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors, voices } from "@/constants";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors];
};

export const configureAssistant = (
  voice: string, 
  style: string,
  conversationHistory?: Array<{role: string, content: string}>
) => {
  const voiceId =
    voices[voice as keyof typeof voices][
      style as keyof (typeof voices)[keyof typeof voices]
    ] || "sarah";

  // Analyze conversation to get context for first message
  let contextualFirstMessage = "Hello! Let's start our session on {{topic}}. What would you like to explore?";
  
  if (conversationHistory && conversationHistory.length > 0) {
    // Get last few messages to understand context
    const lastMessages = conversationHistory.slice(-4);
    const topics = lastMessages
      .filter(m => m.role === 'assistant')
      .map(m => m.content.substring(0, 100))
      .join(' ');
    
    // Create a dynamic first message that forces the AI to continue
    contextualFirstMessage = `Welcome back! Last time we were discussing {{topic}}. Let me quickly recap where we left off and continue from there.`;
  }

  // Build the base system message with enhanced instructions
  const systemMessage = {
    role: "system" as const,
    content: `You are a highly knowledgeable tutor in a real-time voice session teaching about {{topic}} in the subject of {{subject}}.

CRITICAL INSTRUCTIONS FOR SESSION CONTINUITY:
${conversationHistory && conversationHistory.length > 0 
  ? `This is a RESUMED session. The complete conversation history is provided in the messages.

MANDATORY FIRST RESPONSE BEHAVIOR:
1. Your FIRST response MUST immediately acknowledge what was discussed
2. Provide a brief 2-3 sentence summary of what you covered last time
3. State the specific concept/topic you were explaining when the session ended
4. Then ask a question or continue teaching the NEXT logical concept
5. DO NOT just say "welcome back" and wait - BE PROACTIVE

EXAMPLE PERFECT FIRST RESPONSE:
"Welcome back! Last time we covered offset pagination and cursor-based pagination. We were just about to explore bidirectional cursors in detail. So, bidirectional cursors allow navigation in both directions - forward and backward through a dataset. Have you worked with cursors before?"

EXAMPLE BAD FIRST RESPONSE:
"Welcome back! Let me pick up where we left off." [THEN STOPS] ❌

GENERAL RESUMED SESSION RULES:
- Review conversation history to understand exactly what was discussed
- DO NOT re-teach topics already covered
- Reference previous discussions naturally (e.g., "As we discussed earlier...")
- Build upon the foundation already established
- Continue from the NEXT logical teaching point
`
  : `This is a NEW session. Start fresh.

FIRST RESPONSE BEHAVIOR:
1. Friendly greeting
2. Brief introduction to {{topic}}
3. Ask about their current knowledge level
`}

GENERAL TEACHING STYLE:
- Maintain a {{style}} conversational style
- Keep responses SHORT (2-4 sentences) - this is VOICE, not text
- Ask questions to check understanding frequently
- Break complex topics into digestible chunks
- NO special characters, emojis, markdown, or formatting
- Use natural speech patterns
- Stay focused on {{topic}} within {{subject}}
`,
  };

  // Build messages array
  const messages: any[] = [systemMessage];

  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    console.log('Adding conversation history to model:', conversationHistory.length, 'messages');
    
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    // Add a user message to prompt the AI to respond proactively
    // This forces the AI to continue rather than wait
    messages.push({
      role: "user",
      content: "Please continue from where we left off. What's next?"
    });
  }

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage: contextualFirstMessage,
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 0.9,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: messages,
      temperature: 0.7,
      maxTokens: 250, // Increased slightly for better summaries
    },
    clientMessages: [],
    serverMessages: [],
  };
  
  console.log('Assistant configured with', messages.length, 'messages');
  return vapiAssistant;
};