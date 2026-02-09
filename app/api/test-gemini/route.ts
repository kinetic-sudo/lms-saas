import { NextResponse } from 'next/server';
import { callGemini } from '@/lib/AI/gemini';

export async function GET() {
  try {
    console.log('Testing Gemini API...');
    
    // Test 1: Simple response
    const test1 = await callGemini('Say hello', 50, 0.7);
    
    // Test 2: JSON response
    const test2 = await callGemini(
      'List 3 programming languages as JSON array: ["language1", "language2", "language3"]',
      200,
      0.7
    );
    
    // Test 3: Quiz-style question (what we actually use)
    const test3 = await callGemini(
      `Create 1 quiz question about Python. Return ONLY JSON:
[
  {
    "question_text": "What is Python?",
    "question_type": "multiple_choice",
    "options": [
      {"id": "a", "text": "A programming language"},
      {"id": "b", "text": "A snake"},
      {"id": "c", "text": "A framework"},
      {"id": "d", "text": "A database"}
    ],
    "correct_answer": "a",
    "explanation": "Python is a programming language",
    "concept_tested": "Python basics",
    "context": "Introduction"
  }
]`,
      500,
      0.7
    );
    
    return NextResponse.json({
      success: true,
      model: 'gemini-2.5-flash-lite',
      tests: {
        simpleResponse: {
          prompt: 'Say hello',
          response: test1,
          length: test1.length
        },
        jsonResponse: {
          prompt: 'List 3 programming languages',
          response: test2,
          length: test2.length
        },
        quizQuestion: {
          prompt: 'Quiz question format',
          response: test3,
          length: test3.length,
          parsed: (() => {
            try {
              const cleaned = test3.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
              return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch (e) {
              return { error: 'Failed to parse' };
            }
          })()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}