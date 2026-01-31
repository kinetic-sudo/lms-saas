import { getAllConversationHistories } from '@/lib/action/companion.action';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSubjectColor } from '@/lib/utils';
import { MessageCircle, Clock } from 'lucide-react';

export default async function ConversationsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const conversations = await getAllConversationHistories();

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">Saved Conversations</h1>
        <p className="text-slate-600">Resume your previous conversations</p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl">
          <MessageCircle size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 font-medium mb-4">No saved conversations yet</p>
          <Link href="/companion" className="text-indigo-600 font-bold hover:underline">
            Start a conversation
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {conversations.map((conv: any) => {
            const messageCount = conv.messages?.length || 0;
            const lastMessageDate = new Date(conv.last_message_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <Link href={`/companion/${conv.companion_id}`} key={conv.id}>
                <div 
                  className="p-6 rounded-2xl border-2 hover:scale-[1.02] transition-transform cursor-pointer"
                  style={{ backgroundColor: `${getSubjectColor(conv.companion.subject)}20` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: getSubjectColor(conv.companion.subject) }}
                    >
                      <Image 
                        src={`/icons/${conv.companion.subject}.svg`}
                        alt={conv.companion.subject}
                        width={24}
                        height={24}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{conv.companion.name}</h3>
                      <p className="text-sm text-slate-600">{conv.companion.topic}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <MessageCircle size={16} />
                      <span>{messageCount} messages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{lastMessageDate}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}