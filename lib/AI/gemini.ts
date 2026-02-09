// lib/AI/gemini.ts - ADD RETRY LOGIC
'use server'

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callGemini(
  prompt: string, 
  maxTokens: number = 500,
  temperature: number = 0.7,
  retries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5 seconds
        console.log(`⏳ Retry ${attempt}/${retries} after ${waitTime}ms...`);
        await sleep(waitTime);
      }
      
      console.log('📤 Calling Gemini 2.5 Flash Lite...');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: temperature,
            },
          }),
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        try {
          const errorData = JSON.parse(errorText);
          
          // Retry on 503 (overloaded) or 429 (rate limit)
          if (errorData.error?.code === 503 || errorData.error?.code === 429) {
            lastError = new Error(`API_${errorData.error.code}`);
            console.log(`⚠️ API ${errorData.error.code}, will retry...`);
            continue; // Retry
          }
          
          // Don't retry on other errors
          throw new Error(`API_ERROR_${response.status}`);
        } catch (parseError) {
          throw new Error(`API_ERROR_${response.status}`);
        }
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('NO_RESPONSE');
      }

      const text = data.candidates[0].content.parts[0].text;
      console.log('✅ Response:', text.length, 'chars');
      
      return text;
      
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on non-retryable errors
      if (!error.message.includes('503') && !error.message.includes('429')) {
        throw error;
      }
    }
  }
  
  // All retries failed
  console.error('❌ All retries failed:', lastError?.message);
  throw lastError || new Error('MAX_RETRIES_EXCEEDED');
}