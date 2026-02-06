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

  // --- 1. SMART VOICE SELECTION ---
  let selectedProvider = "eleven_labs";
  let selectedVoiceId = "";

  if (language === 'hi') {
    // FORCE AZURE FOR HINDI (Native Vibe)
    selectedProvider = "azure";
    // Check if the requested voice string implies male or female
    const isMale = voice.toLowerCase().includes('male');
    
    // "Madhur" (Male) and "Swara" (Female) are the best native Hindi voices on Azure
    selectedVoiceId = isMale ? "hi-IN-MadhurNeural" : "hi-IN-SwaraNeural";
  } else {
    // KEEP ENGLISH AS ELEVENLABS (Your existing setup)
    selectedProvider = "eleven_labs"; 
    
    // Use your existing mapping logic for English
    const voiceKey = voice; 
    selectedVoiceId = voices[voiceKey as keyof typeof voices]?.[
      style as keyof (typeof voices)[keyof typeof voices]
    ] || "sarah"; // Fallback
  }

  // --- 2. CONTEXTUAL MESSAGES ---
// First message - Modern Hinglish vibe
let contextualFirstMessage = language === 'hi'
? "नमस्ते! चलिए {{topic}} का session शुरू करते हैं। आप इसके बारे में क्या जानना चाहेंगे?"
: "Hello! Let's start our session on {{topic}}. What would you like to explore?";

if (conversationHistory && conversationHistory.length > 0) {
contextualFirstMessage = language === 'hi'
  ? "Welcome back! चलिए, वहीं से continue करते हैं जहाँ हमने last time छोड़ा था।"
  : "Welcome back! Let me continue from where we just left off.";
}

  // System message in selected language (for AI responses)
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

  // --- 3. HISTORY MANAGEMENT ---
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-20);
    console.log('💰 Cost-saving: Using last', recentHistory.length, 'of', conversationHistory.length, 'messages');
    
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    // Continuation prompt
    messages.push({
      role: "user",
      content: language === 'hi' 
        ? "कृपया जहां हम छोड़ गए थे वहीं से जारी रखें।"
        : "Please continue from where we left off."
    });
  }

  // --- 4. CONFIGURATION OBJECT ---
  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage: contextualFirstMessage,
    transcriber: languageConfig.transcriber,
    voice: {
      // @ts-ignore - Vapi types sometimes complain about dynamic providers strings
      provider: selectedProvider, 
      voiceId: selectedVoiceId,
      // Only apply 11labs specific settings if using 11labs
      ...(selectedProvider === "eleven_labs" && {
        stability: 0.4,
        similarityBoost: 0.8,
        style: 0.5,
        useSpeakerBoost: true,
      }),
      // Azure specific settings (optional, defaults are usually fine)
      ...(selectedProvider === "azure" && {
        speed: 0.9, 
      })
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
  
  console.log(`✅ Assistant configured for ${language} using ${selectedProvider} (${selectedVoiceId})`);
  return vapiAssistant;
};

// ... keep your getEnglishSystemPrompt and getHindiSystemPrompt helper functions exactly as they are ...
function getEnglishSystemPrompt(conversationHistory?: any) {
  // ... (your existing code)
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
  return `You are an expert tutor teaching {{topic}} in {{subject}}.
  
  LANGUAGE & STYLE:
  - Speak in **Hinglish** (a mix of Hindi and English).
  - Use Hindi for the sentence structure, but use English for technical terms (e.g., use "Variable", "Loop", "Force", "Interest Rate" instead of their pure Hindi translations).
  - Tone should be like a friendly "Bhai" or "Dost" who is helping them learn.
  - Keep responses SHORT (2-3 sentences).
  
  EXAMPLE STYLE:
  "Bilkul! Toh loops ka concept clear hai? Basically, loops humein code repeat karne mein help karte hain bina bar-bar likhe. Kya aap ek example dekhna chahenge?"

  ${conversationHistory && conversationHistory.length > 0
    ? `Continue from the last point discussed in the history.`
    : `Introduce the topic naturally in Hinglish.`}
    
  IMPORTANT: Do not use difficult Hindi words like 'चर' (Variable) or 'पुनरावृत्ति' (Iteration). Stick to English terms used in common Indian conversation.`;
}