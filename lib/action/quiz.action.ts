'use server'

import { auth } from '@clerk/nextjs/server';
import { CreateSupabaseServiceClient } from '../supabase';
import { callGemini } from '../AI/gemini';

// ============================
// GENERATE QUIZ FROM SESSION
// ============================

// lib/action/quiz.action.ts - Add better error handling

export async function generateQuizFromSession(
    companionId: string,
    conversationHistoryId: string,
    sessionMessages: Array<{role: string, content: string}>,
    subject: string,
    topic: string
  ) {
    try {
      const { userId } = await auth();
      if (!userId) {
        throw new Error('Not authenticated');
      }
  
      // Validate inputs
      if (!sessionMessages || sessionMessages.length < 4) {
        console.warn('Not enough messages for quiz generation');
        throw new Error('Need at least 4 messages to generate quiz');
      }
  
      const supabase = CreateSupabaseServiceClient();
  
      console.log('🎯 Generating quiz from session...');
      console.log('Messages:', sessionMessages.length);
  
      // 1. Extract key concepts
      const keyConcepts = await extractKeyConceptsFromSession(sessionMessages, topic);
      console.log('✅ Concepts:', keyConcepts);
      
      // 2. Generate summary
      const sessionSummary = await generateSessionSummary(sessionMessages, topic);
      console.log('✅ Summary generated');
  
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
  
      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw sessionError;
      }
  
      console.log('✅ Quiz session created:', quizSession.id);
  
      // 4. Generate questions (with fallback)
      let questions = await generateQuestionsFromConcepts(
        keyConcepts,
        sessionMessages,
        topic,
        subject
      );
  
      // Fallback if AI fails
      if (!questions || questions.length === 0) {
        console.warn('⚠️ Using fallback questions');
        questions = generateFallbackQuestions(keyConcepts, topic, subject);
      }
  
      console.log('✅ Generated', questions.length, 'questions');
  
      // 5. Save questions
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
  
      if (questionsError) {
        throw questionsError;
      }
  
      console.log('✅ Questions saved');
  
      return {
        success: true,
        quizSessionId: quizSession.id,
        totalQuestions: questions.length,
      };
  
    } catch (error: any) {
      console.error('❌ Quiz generation error:', error.message);
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
    messages: Array<{role: string, content: string}>,
    topic: string
  ): Promise<string[]> {
    const conversationText = messages
      .filter(m => m.role === 'assistant')
      .map(m => m.content)
      .join(' ')
      .substring(0, 1500);
  
    try {
      const prompt = `Extract 5 key learning concepts from this ${topic} session. Return as JSON array.
  
  Session: ${conversationText}
  
  Format: ["concept1", "concept2", "concept3", "concept4", "concept5"]`;
  
      const result = await callGemini(prompt, 300, 0.5);
      
      const jsonMatch = result.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const concepts = JSON.parse(jsonMatch[0]);
        return concepts.slice(0, 5);
      }
      
      return [topic, `${topic} fundamentals`, `${topic} concepts`];
    } catch (error) {
      console.error('❌ Concept extraction failed:', error);
      return [topic, `${topic} basics`, `${topic} principles`];
    }
}
  
async function generateSessionSummary(
    messages: Array<{role: string, content: string}>,
    topic: string
  ): Promise<string> {
    const conversationText = messages
      .map(m => m.content)
      .join(' ')
      .substring(0, 1500);
  
    try {
      const prompt = `Summarize this ${topic} learning session in 3 bullet points:
  
  ${conversationText}
  
  Format:
  - Point 1
  - Point 2
  - Point 3`;
  
      return await callGemini(prompt, 200, 0.7);
    } catch (error) {
      console.error('❌ Summary failed:', error);
      return `- Learned about ${topic}\n- Covered key concepts\n- Completed practice exercises`;
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
      .join(' ')
      .substring(0, 2000);
  
    try {
      const prompt = `Create 5 quiz questions about ${topic} in ${subject}.
  
  Concepts: ${concepts.join(', ')}
  Session: ${conversationText}
  
  Return ONLY valid JSON (no markdown):
  [
    {
      "question_text": "Question here?",
      "question_type": "multiple_choice",
      "options": [
        {"id": "a", "text": "Option A"},
        {"id": "b", "text": "Option B"},
        {"id": "c", "text": "Option C"},
        {"id": "d", "text": "Option D"}
      ],
      "correct_answer": "a",
      "explanation": "Why A is correct",
      "concept_tested": "${concepts[0]}",
      "context": "From session"
    }
  ]
  
  5 questions total, 4 options each.`;
  
      const result = await callGemini(prompt, 2000, 0.7);
      
      // Clean response
      let cleaned = result
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Extract JSON
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate
      const valid = questions.filter((q: any) => 
        q.question_text && 
        q.options?.length === 4 &&
        q.correct_answer
      );
      
      return valid.slice(0, 5);
      
    } catch (error) {
      console.error('❌ Question generation failed:', error);
      return [];
    }
  }
  
function generateFallbackQuestions(
    concepts: string[],
    topic: string,
    subject: string
  ): any[] {
    return [
      {
        question_text: `What is the main focus of ${topic}?`,
        question_type: 'multiple_choice',
        options: [
          { id: 'a', text: `Understanding ${concepts[0] || topic}` },
          { id: 'b', text: 'Memorizing formulas' },
          { id: 'c', text: 'Skipping practice' },
          { id: 'd', text: 'Avoiding fundamentals' }
        ],
        correct_answer: 'a',
        explanation: `${topic} focuses on understanding ${concepts[0] || 'key concepts'}.`,
        concept_tested: concepts[0] || topic,
        context: 'General understanding'
      },
      {
        question_text: `Which concept is important in ${subject}?`,
        question_type: 'multiple_choice',
        options: [
          { id: 'a', text: 'Random guessing' },
          { id: 'b', text: concepts[1] || `${topic} principles` },
          { id: 'c', text: 'Ignoring theory' },
          { id: 'd', text: 'Skipping basics' }
        ],
        correct_answer: 'b',
        explanation: `${concepts[1] || 'Key principles'} are fundamental to ${subject}.`,
        concept_tested: concepts[1] || topic,
        context: 'Core concepts'
      },
      {
        question_text: `What did you learn about ${topic}?`,
        question_type: 'multiple_choice',
        options: [
          { id: 'a', text: `${concepts[2] || topic} is essential` },
          { id: 'b', text: 'It can be skipped' },
          { id: 'c', text: 'It is outdated' },
          { id: 'd', text: 'It is optional' }
        ],
        correct_answer: 'a',
        explanation: `${concepts[2] || topic} is a crucial part of learning ${subject}.`,
        concept_tested: concepts[2] || topic,
        context: 'Learning outcomes'
      },
      {
        question_text: `How should you approach ${topic}?`,
        question_type: 'multiple_choice',
        options: [
          { id: 'a', text: 'Skip the fundamentals' },
          { id: 'b', text: 'Memorize without understanding' },
          { id: 'c', text: 'Practice and understand concepts' },
          { id: 'd', text: 'Avoid practical examples' }
        ],
        correct_answer: 'c',
        explanation: 'Practicing and understanding concepts leads to better mastery.',
        concept_tested: concepts[3] || topic,
        context: 'Learning strategy'
      },
      {
        question_text: `What is a key takeaway from this ${topic} session?`,
        question_type: 'multiple_choice',
        options: [
          { id: 'a', text: 'Theory is not important' },
          { id: 'b', text: 'Practice makes perfect' },
          { id: 'c', text: `Understanding ${concepts[4] || topic} deeply` },
          { id: 'd', text: 'Shortcuts are always better' }
        ],
        correct_answer: 'c',
        explanation: `Deep understanding of ${concepts[4] || topic} is essential for mastery.`,
        concept_tested: concepts[4] || topic,
        context: 'Session summary'
      },
    ];
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