// lib/AI/gemini.ts - PRODUCTION READY WITH FREE TIER
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
    console.log('📤 Calling Gemini API...');
    
    // Use gemini-2.5-flash-lite (stable, high limits, free tier)
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
      console.error('❌ Gemini API error:', errorText);
      
      // Parse error
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.code === 429) {
          console.warn('⚠️ Quota exceeded');
          throw new Error('QUOTA_EXCEEDED');
        }
      } catch (e) {
        // Not JSON error
      }
      
      throw new Error(`API error ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ No response from Gemini');
      throw new Error('NO_RESPONSE');
    }

    const text = data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini success:', text.length, 'chars');
    
    return text;
  } catch (error: any) {
    console.error('❌ Gemini error:', error.message);
    throw error;
  }
}