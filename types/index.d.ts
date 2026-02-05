// type User = {
//   name: string;
//   email: string;
//   image?: string;
//   accountId: string;
// };

enum Subject {
  maths = "maths",
  language = "language",
  science = "science",
  history = "history",
  coding = "coding",
  geography = "geography",
  economics = "economics",
  finance = "finance",
  business = "business",
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ConversationHistory {
  id: string;
  session_id?: string;
  user_id: string;
  companion_id: string;
  messages: ConversationMessage[];
  last_message_at: string;
  created_at: string;
  updated_at: string;
}



type Companion = Models.DocumentList<Models.Document> & {
  $id: string;
  name: string;
  subject: Subject;
  topic: string;
  duration: number;
  bookmarked: boolean;
};

interface CreateCompanion {
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
}

interface GetAllCompanions {
  limit?: number;
  page?: number;
  subject?: string | string[];
  topic?: string | string[];
}

interface BuildClient {
  key?: string;
  sessionToken?: string;
}

interface CreateUser {
  email: string;
  name: string;
  image?: string;
  accountId: string;
}

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface Avatar {
  userName: string;
  width: number;
  height: number;
  className?: string;
}


interface SavedMessage {
  id: string;
  role: "user" | "system" | "assistant";
  content: string;
}

interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  voice: string;
  style: string;
}

interface QuizSession {
  id: string;
  user_id: string;
  companion_id: string;
  conversation_session_id?: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  total_questions: number;
  session_summary?: string;
  key_concepts: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  score?: number;
  percentage?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  expires_at: string;
  metadata?: Record<string, any>;
}

interface QuizQuestion {
  id: string;
  quiz_session_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
  options: Array<{ id: string; text: string }>;
  correct_answer: string;
  explanation?: string;
  difficulty: string;
  concept_tested: string;
  context_from_session?: string;
  question_order: number;
  created_at: string;
}

interface QuizAnswer {
  id: string;
  quiz_session_id: string;
  question_id: string;
  user_id: string;
  user_answer: string;
  is_correct: boolean;
  time_taken_seconds?: number;
  ai_feedback?: string;
  answered_at: string;
}

interface SessionRecap {
  id: string;
  user_id: string;
  companion_id: string;
  conversation_session_id?: string;
  summary: string;
  key_learnings: string[];
  topics_covered: string[];
  concepts_mastered: string[];
  concepts_to_review: string[];
  next_steps?: string;
  recommended_companions?: string[];
  quiz_session_id?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface UserProgress {
  id: string;
  user_id: string;
  subject: string;
  total_sessions: number;
  total_quizzes_taken: number;
  average_quiz_score: number;
  concepts_learned: string[];
  concepts_struggling: string[];
  current_streak_days: number;
  longest_streak_days: number;
  last_session_date: string;
  created_at: string;
  updated_at: string;
}