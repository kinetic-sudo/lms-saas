import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors,  voices  } from "@/constants";

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

  // Build the system message with context about conversation history
  const systemMessage = {
    role: "system" as const,
    content: `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.

              Tutor Guidelines:
              Stick to the given topic - {{ topic }} and subject - {{ subject }} and teach the student about it.
              Keep the conversation flowing smoothly while maintaining control.
              From time to time make sure that the student is following you and understands you.
              Break down the topic into smaller parts and teach the student one part at a time.
              Keep your style of conversation {{ style }}.
              Keep your responses short, like in a real voice conversation.
              Do not include any special characters in your responses - this is a voice conversation.
              ${conversationHistory && conversationHistory.length > 0 
                ? `\n\nIMPORTANT: This is a continuation of a previous session. You have context of the previous conversation. Acknowledge that you're continuing from where you left off and build upon what was already discussed. Don't repeat information already covered.` 
                : ''}
        `,
  };

  // Build messages array - start with system message
  const messages: any[] = [systemMessage];

  // Add conversation history if provided
  if (conversationHistory && conversationHistory.length > 0) {
    // Add all previous messages to give AI full context
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
  }

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage: "Hello, let's start the session. Today we'll be talking about {{topic}}.",
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
      model: "gpt-4",
      messages: messages, // Use the messages array with history
    },
    clientMessages: [],
    serverMessages: [],
  };
  
  return vapiAssistant;
};
