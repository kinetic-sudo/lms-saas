// lib/AI/gemini.ts 
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

export async function callGemini(
  prompt: string, 
  maxTokens: number = 500,
  temperature: number = 0.7
): Promise<string> {
  try {
    console.log('📤 Calling Gemini 2.5 Flash Lite...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
      console.error('❌ API Error:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.code === 429) {
          throw new Error('QUOTA_EXCEEDED');
        }
      } catch (e) {}
      
      throw new Error(`API_ERROR_${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('NO_RESPONSE');
    }

    const text = data.candidates[0].content.parts[0].text;
    console.log('✅ Response:', text.length, 'chars');
    
    return text;
  } catch (error: any) {
    console.error('❌ Gemini error:', error.message);
    throw error;
  }
}