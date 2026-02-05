// lib/action/quiz.action.ts
'use server'

import { auth } from '@clerk/nextjs/server';
import { CreateSupabaseServiceClient } from '../supabase';

export async function generateQuizFromSession(
  companionId: string,
  conversationHistoryId: string,
  sessionMessages: Array<{role: string, content: string}>,
  subject: string,
  topic: string
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Not authenticated');

    const supabase = CreateSupabaseServiceClient();

    // 1. Extract key concepts from session
    const keyConcepts = await extractKeyConceptsFromSession(sessionMessages);
    
    // 2. Generate session summary
    const sessionSummary = await generateSessionSummary(sessionMessages, topic);

    // 3. Create quiz session
    const { data: quizSession, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: userId,
        companion_id: companionId,
        conversation_session_id: conversationHistoryId,
        subject: subject,
        topic: topic,
        difficulty: 'medium',
        total_questions: 5,
        session_summary: sessionSummary,
        key_concepts: keyConcepts,
        status: 'pending',
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // 4. Generate questions using AI
    const questions = await generateQuestionsFromConcepts(
      keyConcepts,
      sessionMessages,
      topic,
      subject
    );

    // 5. Save questions to database
    const questionsToInsert = questions.map((q, index) => ({
      quiz_session_id: quizSession.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      concept_tested: q.concept_tested,
      context_from_session: q.context,
      question_order: index + 1,
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    return {
      success: true,
      quizSessionId: quizSession.id,
      totalQuestions: questions.length,
    };

  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper: Extract key concepts from conversation
async function extractKeyConceptsFromSession(
  messages: Array<{role: string, content: string}>
): Promise<string[]> {
  // Use AI to extract key concepts
  const conversationText = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Extract 5-7 key concepts from this teaching session. Return ONLY a JSON array of strings.

Session content:
${conversationText.substring(0, 2000)}

Example response: ["concept1", "concept2", "concept3"]`
      }]
    })
  });

  const data = await response.json();
  const content = data.content[0].text;
  
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

// Helper: Generate session summary
async function generateSessionSummary(
  messages: Array<{role: string, content: string}>,
  topic: string
): Promise<string> {
  const conversationText = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Summarize this learning session about "${topic}" in 2-3 sentences.

${conversationText.substring(0, 2000)}`
      }]
    })
  });

  const data = await response.json();
  return data.content[0].text;
}

// Helper: Generate quiz questions
async function generateQuestionsFromConcepts(
  concepts: string[],
  sessionMessages: Array<{role: string, content: string}>,
  topic: string,
  subject: string
): Promise<any[]> {
  const conversationText = sessionMessages
    .map(m => m.content)
    .join('\n')
    .substring(0, 3000);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Create 5 multiple-choice quiz questions based on this learning session about "${topic}" in ${subject}.

Key concepts covered: ${concepts.join(', ')}

Session content:
${conversationText}

Return ONLY a JSON array with this exact structure:
[
  {
    "question_text": "What is...",
    "question_type": "multiple_choice",
    "options": [
      {"id": "a", "text": "Option A"},
      {"id": "b", "text": "Option B"},
      {"id": "c", "text": "Option C"},
      {"id": "d", "text": "Option D"}
    ],
    "correct_answer": "a",
    "explanation": "The correct answer is A because...",
    "concept_tested": "offset pagination",
    "context": "Brief excerpt from session that relates to this question"
  }
]

Make questions specific to what was actually taught in the session.`
      }]
    })
  });

  const data = await response.json();
  const content = data.content[0].text;
  
  try {
    // Clean up the response to extract JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Failed to parse quiz questions:', error);
    return [];
  }
}