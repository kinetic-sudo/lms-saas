// lib/AI/gemini.ts - AUTO-DISCOVERY VERSION
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

// Cache for discovered working endpoint
let workingEndpoint: string | null = null;

async function discoverWorkingEndpoint(): Promise<string> {
  if (workingEndpoint) {
    return workingEndpoint;
  }

  console.log('🔍 Discovering available Gemini models...');

  // List of all possible endpoints to try
  const possibleEndpoints = [
    // v1beta endpoints
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent',
    // v1 endpoints
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent',
  ];

  // Test each endpoint with a simple prompt
  for (const endpoint of possibleEndpoints) {
    try {
      console.log('Testing:', endpoint);
      
      const response = await fetch(`${endpoint}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say hello' }]
          }],
          generationConfig: {
            maxOutputTokens: 10,
            temperature: 0.5,
          }
        }),
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
          console.log('✅ Found working endpoint:', endpoint);
          workingEndpoint = endpoint;
          return endpoint;
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Failed:', endpoint, '-', errorText.substring(0, 100));
      }
    } catch (error) {
      console.log('❌ Error testing:', endpoint);
    }
  }

  throw new Error('No working Gemini endpoint found. Please check your API key.');
}

export async function callGemini(
  prompt: string, 
  maxTokens: number = 500,
  temperature: number = 0.7
): Promise<string> {
  try {
    console.log('📤 Calling Gemini API...');
    console.log('Prompt length:', prompt.length, 'chars');
    
    // Discover working endpoint
    const endpoint = await discoverWorkingEndpoint();
    console.log('Using endpoint:', endpoint);
    
    const response = await fetch(
      `${endpoint}?key=${process.env.GEMINI_API_KEY}`,
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
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status);
      console.error('Response:', errorText);
      
      // Reset cached endpoint if it fails
      workingEndpoint = null;
      
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data: GeminiResponse = await response.json();
    
    // Check for content blocking
    if (data.promptFeedback?.blockReason) {
      console.error('❌ Blocked:', data.promptFeedback.blockReason);
      throw new Error(`Content blocked: ${data.promptFeedback.blockReason}`);
    }
    
    // Check for candidates
    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ No candidates:', JSON.stringify(data, null, 2));
      throw new Error('No response generated');
    }

    const candidate = data.candidates[0];
    
    // Check finish reason
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.warn('⚠️ Unusual finish reason:', candidate.finishReason);
    }

    const text = candidate.content.parts[0].text;
    console.log('✅ Response received:', text.length, 'chars');
    
    return text;
  } catch (error: any) {
    console.error('❌ Gemini error:', error.message);
    throw error;
  }
}

// Helper function to list available models (for debugging)
export async function listAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to list models');
    }

    const data = await response.json();
    const models = data.models?.map((m: any) => m.name) || [];
    console.log('Available models:', models);
    return models;
  } catch (error) {
    console.error('Error listing models:', error);
    return [];
  }
}