// app/api/test-gemini/route.ts
import { NextResponse } from 'next/server';
import { callGemini, listAvailableModels } from '@/lib/AI/gemini';

export async function GET() {
  try {
    // First, list available models
    const availableModels = await listAvailableModels();
    
    // Then test the API
    const result = await callGemini('List 3 programming languages as JSON: ["Python", "JavaScript", "Java"]', 300, 0.7);
    
    return NextResponse.json({
      success: true,
      availableModels,
      response: result,
      responseLength: result.length
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}