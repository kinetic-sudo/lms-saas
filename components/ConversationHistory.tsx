'use client';

import { useEffect, useState } from 'react';
import { getConversationHistory, saveConversationHistory, deleteConversationHistory, hasConversationHistoryPermission } from '@/lib/action/companion.action';
import { Trash2, Clock, MessageCircle } from 'lucide-react';

interface ConversationHistoryProps {
  companionId: string;
  companionName: string;
  onResumeConversation: (messages: ConversationMessage[]) => void;
}

export default function ConversationHistory({ 
  companionId, 
  companionName,
  onResumeConversation 
}: ConversationHistoryProps) {
  const [history, setHistory] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [companionId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const permission = await hasConversationHistoryPermission();
      setHasPermission(permission);
      
      if (permission) {
        const data = await getConversationHistory(companionId);
        setHistory(data);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = () => {
    if (history?.messages) {
      onResumeConversation(history.messages);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this conversation history?')) {
      try {
        await deleteConversationHistory(companionId);
        setHistory(null);
      } catch (error) {
        console.error('Error deleting history:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-2xl p-4 animate-pulse">
        <div className="h-20 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-500 text-white p-3 rounded-xl">
            <MessageCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              Save Your Progress
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              Upgrade to <span className="font-bold text-indigo-600">Intermediate Learner</span> or{' '}
              <span className="font-bold text-purple-600">Pro Companion</span> to save your conversation 
              history and resume where you left off!
            </p>
            <a 
              href="/subscription" 
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!history || !history.messages || history.messages.length === 0) {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 text-slate-600">
          <Clock size={20} />
          <p className="text-sm font-medium">No previous conversation found. Start a new one!</p>
        </div>
      </div>
    );
  }

  const lastMessage = history.messages[history.messages.length - 1];
  const messageCount = history.messages.length;
  const lastMessageDate = new Date(history.last_message_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="bg-green-500 text-white p-3 rounded-xl">
            <MessageCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">
              Previous Conversation Found
            </h3>
            <p className="text-slate-600 text-sm">
              {messageCount} messages • Last active: {lastMessageDate}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
          title="Delete conversation history"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="bg-white/60 rounded-xl p-4 mb-4 border border-green-100">
        <p className="text-sm text-slate-700 italic line-clamp-2">
          "{lastMessage.content}"
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleResume}
          className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-green-700 transition"
        >
          Resume Conversation
        </button>
        <button
          onClick={() => onResumeConversation([])}
          className="flex-1 bg-white text-slate-700 px-4 py-3 rounded-xl font-bold border-2 border-slate-200 hover:border-slate-300 transition"
        >
          Start Fresh
        </button>
      </div>
    </div>
  );
}