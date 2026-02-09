// lib/utils.ts - FIXED VERSION
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors, voices } from "@/constants";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors];
};

export const configureAssistant = (
  voice: string, 
  style: string,
  language: SupportedLanguage = 'en',
  conversationHistory?: Array<{role: string, content: string}>
) => {
  const languageConfig = SUPPORTED_LANGUAGES[language];

  // --- VOICE SELECTION FOR BOTH LANGUAGES ---
  let selectedVoiceId = "";
  
  if (language === 'hi') {
    // Use 11Labs multilingual voices for Hindi
    // These voices can speak Hindi naturally
    const isMale = voice.toLowerCase().includes('male');
    
    // 11Labs voices that support Hindi well:
    selectedVoiceId = isMale 
      ? "pNInz6obpgDQGcFmaJgB"  // Adam (supports Hindi)
      : "EXAVITQu4vr4xnSDxMaL";  // Bella (supports Hindi)
  } else {
    // English voices (your existing setup)
    const voiceKey = voice; 
    selectedVoiceId = voices[voiceKey as keyof typeof voices]?.[
      style as keyof (typeof voices)[keyof typeof voices]
    ] || "sarah";
  }

  // First message
  let contextualFirstMessage = language === 'hi'
    ? "नमस्ते! चलिए {{topic}} का session शुरू करते हैं। आप इसके बारे में क्या जानना चाहेंगे?"
    : "Hello! Let's start our session on {{topic}}. What would you like to explore?";

  if (conversationHistory && conversationHistory.length > 0) {
    contextualFirstMessage = language === 'hi'
      ? "Welcome back! चलिए, वहीं से continue करते हैं जहाँ हमने last time छोड़ा था।"
      : "Welcome back! Let me continue from where we just left off.";
  }

  // System prompt
  const systemPrompt = language === 'hi' 
    ? getHindiSystemPrompt(conversationHistory)
    : getEnglishSystemPrompt(conversationHistory);

  const systemMessage = {
    role: "system" as const,
    content: systemPrompt
      .replace(/{{topic}}/g, '{{topic}}')
      .replace(/{{subject}}/g, '{{subject}}')
      .replace(/{{style}}/g, '{{style}}'),
  };

  const messages: any[] = [systemMessage];

  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-20);
    console.log('💰 Cost-saving: Using last', recentHistory.length, 'of', conversationHistory.length, 'messages');
    
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    messages.push({
      role: "user",
      content: language === 'hi' 
        ? "कृपया जहां हम छोड़ गए थे वहीं से जारी रखें।"
        : "Please continue from where we left off."
    });
  }

  // VAPI Configuration
  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage: contextualFirstMessage,
    transcriber: languageConfig.transcriber,
    voice: {
      provider: "11labs",  // ALWAYS use 11labs (VAPI supports this)
      voiceId: selectedVoiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 0.9,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      maxTokens: 200,
    },
    clientMessages: [],
    serverMessages: [],
  };
  
  console.log(`✅ Assistant configured for ${language} using eleven_labs (${selectedVoiceId})`);
  return vapiAssistant;
};

// Helper functions
function getEnglishSystemPrompt(conversationHistory?: any) {
  return `You are a highly knowledgeable tutor teaching about {{topic}} in {{subject}}.

${conversationHistory && conversationHistory.length > 0 
  ? `RESUMED SESSION: Review the conversation history and continue from the last topic discussed.
- Provide a brief recap (1-2 sentences)
- Continue teaching the NEXT logical concept
- Reference previous discussions naturally`
  : `NEW SESSION: Introduce {{topic}} and assess knowledge level.`}

TEACHING STYLE:
- {{style}} conversational tone
- SHORT responses (2-3 sentences for voice)
- Ask questions frequently
- NO markdown, emojis, special characters
- Natural speech patterns in English`;
}

function getHindiSystemPrompt(conversationHistory?: any) {
  return `आप {{subject}} में {{topic}} पढ़ाने वाले एक अनुभवी शिक्षक हैं।

LANGUAGE & STYLE:
- Speak in **Hinglish** (Hindi-English mix)
- Use Hindi for basic sentences, English for technical terms
- Example: "Bilkul! Toh loops ka concept clear hai? Basically, loops help karte hain code repeat karne mein."
- Keep responses SHORT (2-3 sentences)
- Friendly, conversational tone like talking to a friend

${conversationHistory && conversationHistory.length > 0
  ? `RESUMED SESSION: Continue from where we left off in the conversation history.`
  : `NEW SESSION: Introduce {{topic}} naturally in Hinglish.`}

IMPORTANT: 
- Use English for all technical terms (Variable, Loop, Function, etc.)
- Do NOT use complex Hindi words
- Sound natural like how Indians speak in daily life`;
}