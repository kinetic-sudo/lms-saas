'use server'

import { auth } from '@clerk/nextjs/server';
import { CreateSupabaseServiceClient } from '../supabase';
import { callGemini } from '../AI/gemini';

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
      const prompt = `Extract 5-7 key concepts taught in this learning session. 
  Return ONLY a valid JSON array of strings, with no additional text or explanation.
  
  Session content:
  ${conversationText}
  
  Required format (respond with ONLY this, nothing else):
  ["concept1", "concept2", "concept3", "concept4", "concept5"]
  
  Example response:
  ["Python loops", "Range function", "Conditional logic", "Break statements", "Iteration control"]`;
  
      const result = await callGemini(prompt, 500, 0.5);
      
      console.log('Gemini concepts response:', result);
      
      // Extract JSON array from response
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const concepts = JSON.parse(jsonMatch[0]);
        console.log('✅ Extracted concepts:', concepts);
        return concepts;
      }
      
      console.warn('⚠️ Could not parse concepts, using fallback');
      return ['General concepts from session'];
    } catch (error) {
      console.error('❌ Error extracting concepts:', error);
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
      const prompt = `Create a concise 3-point summary of this learning session about "${topic}". 
  Each point should be one clear sentence that captures a key learning.
  
  Session transcript:
  ${conversationText}
  
  Format your response as:
  - First key learning point
  - Second key learning point
  - Third key learning point
  
  Keep each point to one sentence. Focus on what the student learned, not what was discussed.`;
  
      const summary = await callGemini(prompt, 300, 0.7);
      
      console.log('✅ Generated summary:', summary.substring(0, 100) + '...');
      return summary;
    } catch (error) {
      console.error('❌ Error generating summary:', error);
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
      const prompt = `Create 5 multiple-choice quiz questions based on this "${topic}" learning session in ${subject}.
  
  Key concepts covered: ${concepts.join(', ')}
  
  Session content:
  ${conversationText}
  
  CRITICAL: Return ONLY a valid JSON array with NO additional text before or after. Do not include markdown code blocks or any explanation.
  
  Required JSON format (respond with ONLY this structure):
  [
    {
      "question_text": "What is the purpose of the break statement in Python loops?",
      "question_type": "multiple_choice",
      "options": [
        {"id": "a", "text": "To pause the loop temporarily"},
        {"id": "b", "text": "To exit the loop immediately"},
        {"id": "c", "text": "To skip the current iteration"},
        {"id": "d", "text": "To restart the loop"}
      ],
      "correct_answer": "b",
      "explanation": "The break statement exits the loop immediately when executed.",
      "concept_tested": "break statements",
      "context": "We discussed how break statements control loop execution"
    }
  ]
  
  Requirements:
  1. Create exactly 5 questions
  2. Each question must have 4 options (a, b, c, d)
  3. Questions must be specific to what was taught in this session
  4. Include a clear explanation for each correct answer
  5. Return pure JSON only, no markdown or extra text`;
  
      const result = await callGemini(prompt, 2500, 0.7);
      
      console.log('Gemini questions response (first 200 chars):', result.substring(0, 200));
      
      // Clean up response - remove markdown code blocks if present
      let cleanedResult = result.trim();
      cleanedResult = cleanedResult.replace(/```json\n?/g, '');
      cleanedResult = cleanedResult.replace(/```\n?/g, '');
      cleanedResult = cleanedResult.trim();
      
      // Extract JSON array
      const jsonMatch = cleanedResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        console.log('✅ Generated', questions.length, 'questions');
        return questions;
      }
      
      console.warn('⚠️ Could not parse questions JSON');
      return [];
    } catch (error) {
      console.error('❌ Error generating questions:', error);
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