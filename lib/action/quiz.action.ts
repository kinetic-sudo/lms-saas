'use server'

import { auth } from '@clerk/nextjs/server';
import { CreateSupabaseServiceClient } from '../supabase';
import { callGemini } from '../AI/gemini';

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
    if (!sessionMessages || sessionMessages.length < 4) {
      throw new Error('Need at least 4 messages');
    }

    const supabase = CreateSupabaseServiceClient();

    console.log('🎯 Generating quiz...');

    // Extract concepts
    const keyConcepts = await extractKeyConceptsFromSession(sessionMessages, topic);
    console.log('✅ Concepts:', keyConcepts);
    
    // Generate summary
    const sessionSummary = await generateSessionSummary(sessionMessages, topic);
    console.log('✅ Summary generated');

    // Create quiz session
    const { data: quizSession, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: userId,
        companion_id: companionId,
        conversation_session_id: conversationHistoryId,
        subject,
        topic,
        difficulty: 'medium',
        total_questions: 5,
        session_summary: sessionSummary,
        key_concepts: keyConcepts,
        status: 'pending',
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Generate questions
    const questions = await generateQuestionsWithFallback(
      keyConcepts,
      sessionMessages,
      topic,
      subject
    );

    // Save questions
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

    console.log('✅ Quiz created:', quizSession.id);

    return {
      success: true,
      quizSessionId: quizSession.id,
      totalQuestions: questions.length,
    };

  } catch (error: any) {
    console.error('❌ Quiz error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function extractKeyConceptsFromSession(
  messages: Array<{role: string, content: string}>,
  topic: string
): Promise<string[]> {
  try {
    const text = messages
      .filter(m => m.role === 'assistant')
      .map(m => m.content)
      .join(' ')
      .substring(0, 1500);

    const prompt = `Extract 5 key concepts from this ${topic} session. Return ONLY a JSON array.

${text}

Format: ["concept1", "concept2", "concept3", "concept4", "concept5"]`;

    const result = await callGemini(prompt, 300, 0.5);
    
    // Remove markdown
    const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*?\]/);
    
    if (jsonMatch) {
      const concepts = JSON.parse(jsonMatch[0]);
      if (concepts.length >= 3) {
        return concepts.slice(0, 5);
      }
    }
  } catch (error) {
    console.log('⚠️ AI failed, using text extraction');
  }

  return extractConceptsFromText(messages, topic);
}

function extractConceptsFromText(
  messages: Array<{role: string, content: string}>,
  topic: string
): string[] {
  const text = messages.map(m => m.content).join(' ').toLowerCase();
  const words = text.split(/\s+/);
  const wordFreq = new Map<string, number>();

  words.forEach(word => {
    if (word.length > 4 && !['about', 'would', 'could', 'should', 'there'].includes(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });

  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  return topWords.length >= 3 
    ? topWords 
    : [topic, `${topic} fundamentals`, `${topic} concepts`, `${topic} principles`, `${topic} techniques`];
}

async function generateSessionSummary(
  messages: Array<{role: string, content: string}>,
  topic: string
): Promise<string> {
  try {
    const text = messages.map(m => m.content).join(' ').substring(0, 1500);

    const prompt = `Summarize this ${topic} session in 3 points:

${text}

Format:
- Point 1
- Point 2
- Point 3`;

    return await callGemini(prompt, 200, 0.7);
  } catch (error) {
    return `- Learned about ${topic}\n- Covered key concepts\n- Practiced with examples`;
  }
}

async function generateQuestionsWithFallback(
  concepts: string[],
  sessionMessages: Array<{role: string, content: string}>,
  topic: string,
  subject: string
): Promise<any[]> {
  try {
    const text = sessionMessages.map(m => m.content).join(' ').substring(0, 2000);

    const prompt = `Create 5 quiz questions about ${topic}.

Concepts: ${concepts.join(', ')}
Session: ${text}

Return ONLY valid JSON (no markdown):
[
  {
    "question_text": "Question?",
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

Make exactly 5 questions.`;

    const result = await callGemini(prompt, 2000, 0.7);
    
    const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      const valid = questions.filter((q: any) => 
        q.question_text && q.options?.length === 4 && q.correct_answer
      );
      
      if (valid.length >= 3) {
        return valid.slice(0, 5);
      }
    }
  } catch (error) {
    console.log('⚠️ AI failed, using fallback');
  }

  return generateFallbackQuestions(concepts, topic, subject);
}

function generateFallbackQuestions(
  concepts: string[],
  topic: string,
  subject: string
): any[] {
  return [
    {
      question_text: `What is the main focus when learning ${topic}?`,
      question_type: 'multiple_choice',
      options: [
        { id: 'a', text: `Understanding ${concepts[0] || topic} fundamentals` },
        { id: 'b', text: 'Memorizing without understanding' },
        { id: 'c', text: 'Skipping the basics' },
        { id: 'd', text: 'Avoiding practice' }
      ],
      correct_answer: 'a',
      explanation: `Understanding ${concepts[0] || topic} is crucial for mastery.`,
      concept_tested: concepts[0] || topic,
      context: 'Core understanding'
    },
    {
      question_text: `Which concept is essential in ${topic}?`,
      question_type: 'multiple_choice',
      options: [
        { id: 'a', text: 'Ignoring best practices' },
        { id: 'b', text: concepts[1] || `${topic} principles` },
        { id: 'c', text: 'Skipping documentation' },
        { id: 'd', text: 'Avoiding testing' }
      ],
      correct_answer: 'b',
      explanation: `${concepts[1] || 'These principles'} are fundamental to ${topic}.`,
      concept_tested: concepts[1] || topic,
      context: 'Key concepts'
    },
    {
      question_text: `What is important in ${topic}?`,
      question_type: 'multiple_choice',
      options: [
        { id: 'a', text: `${concepts[2] || topic} techniques` },
        { id: 'b', text: 'Rushing without understanding' },
        { id: 'c', text: 'Avoiding hands-on practice' },
        { id: 'd', text: 'Skipping error handling' }
      ],
      correct_answer: 'a',
      explanation: `Mastering ${concepts[2] || topic} techniques is essential.`,
      concept_tested: concepts[2] || topic,
      context: 'Practical application'
    },
    {
      question_text: `How should you approach ${topic}?`,
      question_type: 'multiple_choice',
      options: [
        { id: 'a', text: 'Skip fundamentals' },
        { id: 'b', text: 'Only read theory' },
        { id: 'c', text: 'Practice regularly and understand deeply' },
        { id: 'd', text: 'Memorize without comprehension' }
      ],
      correct_answer: 'c',
      explanation: 'Practice with understanding leads to mastery.',
      concept_tested: concepts[3] || topic,
      context: 'Learning methodology'
    },
    {
      question_text: `What is a key takeaway from ${topic}?`,
      question_type: 'multiple_choice',
      options: [
        { id: 'a', text: 'Theory is unnecessary' },
        { id: 'b', text: 'Practice is optional' },
        { id: 'c', text: `Deep understanding of ${concepts[4] || topic}` },
        { id: 'd', text: 'Shortcuts are better' }
      ],
      correct_answer: 'c',
      explanation: `Deep understanding of ${concepts[4] || topic} is essential.`,
      concept_tested: concepts[4] || topic,
      context: 'Session summary'
    },
  ];
}

// Other functions...
export async function getQuizData(quizSessionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Not authenticated');

    const supabase = CreateSupabaseServiceClient();

    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', quizSessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) throw sessionError;

    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_session_id', quizSessionId)
      .order('question_order', { ascending: true });

    if (questionsError) throw questionsError;

    return {
      success: true,
      data: {
        session,
        questions,
        summary: session.session_summary?.split('\n').filter((s: string) => s.trim()) || [],
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitQuizAnswers(
  quizSessionId: string,
  answers: Record<number, string>
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Not authenticated');

    const supabase = CreateSupabaseServiceClient();

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_session_id', quizSessionId)
      .order('question_order', { ascending: true });

    if (!questions) throw new Error('Questions not found');

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

    await supabase.from('quiz_answers').insert(answerRecords);

    const percentage = (correctCount / questions.length) * 100;

    await supabase
      .from('quiz_sessions')
      .update({
        status: 'completed',
        score: correctCount,
        percentage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', quizSessionId);

    await updateUserProgress(userId, questions[0].concept_tested, percentage);

    return {
      success: true,
      score: correctCount,
      total: questions.length,
      percentage,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function updateUserProgress(userId: string, subject: string, quizScore: number) {
  const supabase = CreateSupabaseServiceClient();

  const { data: existing } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('subject', subject)
    .single();

  if (existing) {
    const newAvg = ((existing.average_quiz_score * existing.total_quizzes_taken) + quizScore) 
      / (existing.total_quizzes_taken + 1);

    await supabase.from('user_progress').update({
      total_quizzes_taken: existing.total_quizzes_taken + 1,
      average_quiz_score: newAvg,
      last_session_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
  } else {
    await supabase.from('user_progress').insert({
      user_id: userId,
      subject,
      total_quizzes_taken: 1,
      average_quiz_score: quizScore,
      last_session_date: new Date().toISOString().split('T')[0],
    });
  }
}

export async function getUserProgress(subject: string) {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const supabase = CreateSupabaseServiceClient();
    const { data } = await supabase.from('user_progress').select('*').eq('user_id', userId).eq('subject', subject).single();
    return data;
  } catch (error) {
    return null;
  }
}

export async function getQuizHistory() {
  try {
    const { userId } = await auth();
    if (!userId) return [];
    const supabase = CreateSupabaseServiceClient();
    const { data } = await supabase.from('quiz_sessions').select(`*, companions:companion_id (name, subject, topic)`).eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getQuizResults(quizSessionId: string) {
    try {
      const { userId } = await auth();
      if (!userId) throw new Error('Not authenticated');
  
      const supabase = CreateSupabaseServiceClient();
  
      // Get quiz session
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', quizSessionId)
        .eq('user_id', userId)
        .single();
  
      if (sessionError) throw sessionError;
  
      // Get questions with user answers
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          quiz_answers!inner(user_answer, is_correct)
        `)
        .eq('quiz_session_id', quizSessionId)
        .order('question_order', { ascending: true });
  
      if (questionsError) throw questionsError;
  
      // Merge user answers with questions
      const questionsWithAnswers = questions.map((q: any) => ({
        ...q,
        user_answer: q.quiz_answers[0]?.user_answer || '',
        is_correct: q.quiz_answers[0]?.is_correct || false,
      }));
  
      return {
        success: true,
        data: {
          score: session.score,
          total: session.total_questions,
          percentage: session.percentage,
          questions: questionsWithAnswers,
        },
      };
    } catch (error: any) {
      console.error('Error fetching quiz results:', error);
      return { success: false, error: error.message };
    }
  }