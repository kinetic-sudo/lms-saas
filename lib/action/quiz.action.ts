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
        console.error('No user ID');
        throw new Error('Not authenticated');
      }
  
      // Validate inputs
      if (!sessionMessages || sessionMessages.length < 4) {
        console.error('Not enough messages:', sessionMessages?.length);
        throw new Error('Need at least 4 messages to generate quiz');
      }
  
      const supabase = CreateSupabaseServiceClient();
  
      console.log('🎯 Generating quiz from session...');
      console.log('User:', userId);
      console.log('Companion:', companionId);
      console.log('Messages:', sessionMessages.length);
  
      // 1. Extract key concepts from session
      console.log('Extracting concepts...');
      const keyConcepts = await extractKeyConceptsFromSession(sessionMessages);
      console.log('✅ Concepts:', keyConcepts);
      
      // 2. Generate session summary
      console.log('Generating summary...');
      const sessionSummary = await generateSessionSummary(sessionMessages, topic);
      console.log('✅ Summary generated');
  
      // 3. Create quiz session
      console.log('Creating quiz session...');
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
  
      // 4. Generate questions using AI
      console.log('Generating questions...');
      const questions = await generateQuestionsFromConcepts(
        keyConcepts,
        sessionMessages,
        topic,
        subject
      );
  
      if (!questions || questions.length === 0) {
        throw new Error('Failed to generate questions');
      }
  
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
  
      if (questionsError) {
        console.error('Questions insert error:', questionsError);
        throw questionsError;
      }
  
      console.log('✅ Questions saved to database');
  
      return {
        success: true,
        quizSessionId: quizSession.id,
        totalQuestions: questions.length,
      };
  
    } catch (error: any) {
      console.error('❌ Error generating quiz:', error);
      console.error('Error stack:', error.stack);
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
  

// lib/action/quiz.action.ts - UPDATE generateQuestionsFromConcepts function

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
  
      console.log('📝 Calling Gemini API...');
      const result = await callGemini(prompt, 2500, 0.7);
      
      console.log('Gemini raw response:', result.substring(0, 500));
      
      // Clean up response - remove markdown code blocks if present
      let cleanedResult = result.trim();
      cleanedResult = cleanedResult.replace(/```json\s*/g, '');
      cleanedResult = cleanedResult.replace(/```\s*/g, '');
      cleanedResult = cleanedResult.trim();
      
      console.log('Cleaned response:', cleanedResult.substring(0, 500));
      
      // Extract JSON array
      const jsonMatch = cleanedResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const questions = JSON.parse(jsonMatch[0]);
          
          // Validate questions structure
          if (Array.isArray(questions) && questions.length > 0) {
            const validQuestions = questions.filter(q => 
              q.question_text && 
              q.options && 
              Array.isArray(q.options) &&
              q.options.length >= 4 &&
              q.correct_answer
            );
            
            if (validQuestions.length > 0) {
              console.log('✅ Generated', validQuestions.length, 'valid questions');
              return validQuestions;
            }
          }
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.error('Failed JSON:', jsonMatch[0]);
        }
      }
      
      console.warn('⚠️ Could not parse questions JSON, using fallback');
      
      // FALLBACK: Generate generic questions based on concepts
      return generateFallbackQuestions(concepts, topic, subject);
      
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return fallback questions instead of throwing
      return generateFallbackQuestions(concepts, topic, subject);
    }
  }
  
  // NEW: Fallback question generator
  function generateFallbackQuestions(
    concepts: string[],
    topic: string,
    subject: string
  ): any[] {
    console.log('🔄 Generating fallback questions for:', topic);
    
    const fallbackQuestions = concepts.slice(0, 5).map((concept, index) => ({
      question_text: `What did you learn about ${concept} in this ${topic} session?`,
      question_type: 'multiple_choice',
      options: [
        { id: 'a', text: `${concept} is a fundamental concept in ${subject}` },
        { id: 'b', text: `${concept} is not relevant to ${topic}` },
        { id: 'c', text: `${concept} should be avoided in practice` },
        { id: 'd', text: `${concept} is an outdated concept` }
      ],
      correct_answer: 'a',
      explanation: `During the session, we covered ${concept} as an important part of ${topic}.`,
      concept_tested: concept,
      context: `We discussed ${concept} in the context of ${topic}`
    }));
    
    // Ensure we have at least 5 questions
    while (fallbackQuestions.length < 5) {
      const index = fallbackQuestions.length;
      fallbackQuestions.push({
        question_text: `What is an important aspect of ${topic}?`,
        question_type: 'multiple_choice',
        options: [
          { id: 'a', text: `Understanding the fundamentals of ${topic}` },
          { id: 'b', text: `Ignoring ${subject} principles` },
          { id: 'c', text: `Skipping practice exercises` },
          { id: 'd', text: `Memorizing without understanding` }
        ],
        correct_answer: 'a',
        explanation: `It's important to understand the fundamentals when learning ${topic}.`,
        concept_tested: topic,
        context: `General concept from ${topic} session`
      });
    }
    
    console.log('✅ Generated', fallbackQuestions.length, 'fallback questions');
    return fallbackQuestions;
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