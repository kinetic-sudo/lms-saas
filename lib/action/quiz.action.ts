'use server'

import { auth } from '@clerk/nextjs/server';
import { CreateSupabaseServiceClient } from '../supabase';

// ============================
// GENERATE QUIZ FROM SESSION
// ============================

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

    console.log('🎯 Generating quiz from session...');

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

    console.log('✅ Quiz session created:', quizSession.id);

    // 4. Generate questions using AI
    const questions = await generateQuestionsFromConcepts(
      keyConcepts,
      sessionMessages,
      topic,
      subject
    );

    console.log('✅ Generated', questions.length, 'questions');

    // 5. Save questions to database
    const questionsToInsert = questions.map((q, index) => ({
      quiz_session_id: quizSession.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      concept_tested: q.concept_tested || keyConcepts[0] || topic,
      context_from_session: q.context || '',
      question_order: index + 1,
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    console.log('✅ Questions saved to database');

    return {
      success: true,
      quizSessionId: quizSession.id,
      totalQuestions: questions.length,
    };

  } catch (error: any) {
    console.error('❌ Error generating quiz:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================
// GET QUIZ DATA
// ============================

export async function getQuizData(quizSessionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Not authenticated');

    const supabase = CreateSupabaseServiceClient();

    // Fetch quiz session
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', quizSessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) throw sessionError;

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_session_id', quizSessionId)
      .order('question_order', { ascending: true });

    if (questionsError) throw questionsError;

    // Parse summary into array
    const summaryArray = session.session_summary 
      ? session.session_summary.split('\n').filter((s: string) => s.trim())
      : [];

    return {
      success: true,
      data: {
        session,
        questions,
        summary: summaryArray,
      },
    };
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================
// SUBMIT QUIZ ANSWERS
// ============================

export async function submitQuizAnswers(
  quizSessionId: string,
  answers: Record<number, string> // { questionIndex: selectedOptionId }
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Not authenticated');

    const supabase = CreateSupabaseServiceClient();

    // Get questions with correct answers
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_session_id', quizSessionId)
      .order('question_order', { ascending: true });

    if (!questions) throw new Error('Questions not found');

    // Calculate score
    let correctCount = 0;
    const answerRecords = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = answers[i];
      const isCorrect = userAnswer === question.correct_answer;

      if (isCorrect) correctCount++;

      answerRecords.push({
        quiz_session_id: quizSessionId,
        question_id: question.id,
        user_id: userId,
        user_answer: userAnswer || '',
        is_correct: isCorrect,
      });
    }

    // Save answers
    const { error: answersError } = await supabase
      .from('quiz_answers')
      .insert(answerRecords);

    if (answersError) throw answersError;

    // Update quiz session
    const percentage = (correctCount / questions.length) * 100;

    const { error: updateError } = await supabase
      .from('quiz_sessions')
      .update({
        status: 'completed',
        score: correctCount,
        percentage: percentage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', quizSessionId);

    if (updateError) throw updateError;

    // Update user progress
    await updateUserProgress(userId, questions[0].concept_tested, percentage);

    return {
      success: true,
      score: correctCount,
      total: questions.length,
      percentage,
    };

  } catch (error: any) {
    console.error('Error submitting quiz:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================
// GET USER PROGRESS
// ============================

export async function getUserProgress(subject: string) {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const supabase = CreateSupabaseServiceClient();

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data;
  } catch (error) {
    console.error('Error fetching progress:', error);
    return null;
  }
}

// ============================
// GET QUIZ HISTORY
// ============================

export async function getQuizHistory() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const supabase = CreateSupabaseServiceClient();

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select(`
        *,
        companions:companion_id (name, subject, topic)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    return [];
  }
}

// ============================
// HELPER FUNCTIONS
// ============================

async function extractKeyConceptsFromSession(
  messages: Array<{role: string, content: string}>
): Promise<string[]> {
  const conversationText = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .join('\n')
    .substring(0, 2000);

  try {
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
          content: `Extract 5-7 key concepts taught in this session. Return ONLY a JSON array of strings, nothing else.

Session:
${conversationText}

Format: ["concept1", "concept2", "concept3"]`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return ['General concepts from session'];
  } catch (error) {
    console.error('Error extracting concepts:', error);
    return ['Session content'];
  }
}

async function generateSessionSummary(
  messages: Array<{role: string, content: string}>,
  topic: string
): Promise<string> {
  const conversationText = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')
    .substring(0, 2000);

  try {
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
          content: `Create a 3-point summary of this learning session about "${topic}". 
Each point should be one clear sentence starting with a key learning.

Format:
- Point 1
- Point 2
- Point 3

Session:
${conversationText}`
        }]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error generating summary:', error);
    return `Session about ${topic} completed successfully.`;
  }
}

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

  try {
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
          content: `Create 5 multiple-choice quiz questions based on this "${topic}" session in ${subject}.

Concepts: ${concepts.join(', ')}

Session:
${conversationText}

Return ONLY valid JSON array:
[
  {
    "question_text": "Clear question?",
    "question_type": "multiple_choice",
    "options": [
      {"id": "a", "text": "Option A"},
      {"id": "b", "text": "Option B"},
      {"id": "c", "text": "Option C"},
      {"id": "d", "text": "Option D"}
    ],
    "correct_answer": "a",
    "explanation": "Why A is correct...",
    "concept_tested": "${concepts[0] || topic}",
    "context": "Session excerpt"
  }
]

Make questions specific to what was actually taught.`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error) {
    console.error('Error generating questions:', error);
    return [];
  }
}

async function updateUserProgress(
  userId: string,
  subject: string,
  quizScore: number
) {
  const supabase = CreateSupabaseServiceClient();

  const { data: existing } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('subject', subject)
    .single();

  if (existing) {
    // Update existing
    const newAvg = ((existing.average_quiz_score * existing.total_quizzes_taken) + quizScore) 
      / (existing.total_quizzes_taken + 1);

    await supabase
      .from('user_progress')
      .update({
        total_quizzes_taken: existing.total_quizzes_taken + 1,
        average_quiz_score: newAvg,
        last_session_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Create new
    await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        subject: subject,
        total_quizzes_taken: 1,
        average_quiz_score: quizScore,
        last_session_date: new Date().toISOString().split('T')[0],
      });
  }
}