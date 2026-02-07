// components/CompanionComponent.tsx

'use client'

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sdk';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import soundwaves from '../constants/soundwaves.json'
import { addToSessionHistory, saveConversationHistory, hasConversationHistoryPermission, hasQuizPermission } from '@/lib/action/companion.action';
import { Mic, MicOff, Play, Square, MessageCircle } from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/constants';
import { Globe } from 'lucide-react';
import { generateQuizFromSession } from '@/lib/action/quiz.action';

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED'
}

interface CompanionComponentProps {
    companionId: string;
    subject: string;
    topic: string;
    name: string;
    userName: string;
    userImage: string;
    style: string;
    voice: string;
    initialConversationHistory?: any;
}

interface SavedMessage {
    id?: string;
    role: 'user' | 'assistant'
    content: string;
    timestamp: string;
}

const CompanionComponent = ({ 
    companionId, 
    subject, 
    topic, 
    name, 
    userName, 
    userImage, 
    style, 
    voice,
    initialConversationHistory
}: CompanionComponentProps) => {

    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [hasHistoryPermission, setHasHistoryPermission] = useState<boolean | null>(null); // Changed to null initially
    const [savedConversation, setSavedConversation] = useState<any>(initialConversationHistory);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [isResuming, setIsResuming] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [showQuizPrompt, setShowQuizPrompt] = useState(false);
    const [quizSessionId, setQuizSessionId] = useState<string | null>(null)





    const lottieRef = useRef<LottieRefCurrentProps>(null);

    // Check for saved conversation on mount
    useEffect(() => {
        const checkConversationHistory = async () => {
            try {
                const permission = await hasConversationHistoryPermission();
                setHasHistoryPermission(permission);
                
                console.log('Initial conversation history from server:', initialConversationHistory);
                console.log('Has permission:', permission);
                
                if (permission && initialConversationHistory && initialConversationHistory.messages && initialConversationHistory.messages.length > 0) {
                    setSavedConversation(initialConversationHistory);
                    setShowResumePrompt(true);
                }
            } catch (error) {
                console.error('Error checking conversation history:', error);
                setHasHistoryPermission(false);
            }
        };

        checkConversationHistory();
    }, [companionId, initialConversationHistory]);

    // Auto-save conversation every 30 seconds when active
    useEffect(() => {
        if (!hasHistoryPermission || callStatus !== CallStatus.ACTIVE) return;

        const saveInterval = setInterval(async () => {
            if (messages.length > 0) {
                try {
                    const messagesToSave = [...messages].reverse();
                    await saveConversationHistory(companionId, messagesToSave);
                    // console.log('Conversation auto-saved', messagesToSave.length, 'messages');
                } catch (error) {
                    console.error('Error auto-saving conversation:', error);
                }
            }
        }, 30000);

        return () => clearInterval(saveInterval);
    }, [hasHistoryPermission, callStatus, messages, companionId]);

    // --- Lottie Animation Logic ---
    useEffect(() => {
        if (lottieRef.current) {
            if (isSpeaking) {
                lottieRef.current.play()
            } else {
                lottieRef.current.stop()
            }
        }
    }, [isSpeaking])

    // --- Vapi Event Handlers ---
    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE)
        const onCallEnd = async () => {
            setCallStatus(CallStatus.FINISHED);
            await addToSessionHistory(companionId);
            
            if (hasHistoryPermission && messages.length > 0) {
                try {
                    const messagesToSave = [...messages].reverse();
                    const  savedHistory = await saveConversationHistory(companionId, messagesToSave, selectedLanguage);
                    // check if user has quiz permision
                    const canTakeQuiz = await hasQuizPermission();

                    if(canTakeQuiz && savedHistory?.id) {
                        console.log('🎯 Generating quiz for session...');
                    }
                    
                    // generate quizz from session 
                    const quizResult = await generateQuizFromSession(
                        companionId,
                        savedHistory.id,
                        messagesToSave,
                        subject,
                        topic
                    )

                    if (quizResult.success) {
                        console.log('Quiz generated:', quizResult.quizSessionId)
                    }

                    // show quiz prompt 
                    setShowQuizPrompt(true);
                    setQuizSessionId(quizResult.quizSessionId)

                
                } catch (error) {
                    console.error('Error saving final conversation:', error);
                }
            }
            
            setIsResuming(false);
        }
        const onMessage = (message: any) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage: SavedMessage = {
                    id: `${Date.now()}-${Math.random()}`,
                    // FIX: Add 'as ...' type assertion here
                    role: message.role as 'user' | 'assistant', 
                    content: message.transcript,
                    timestamp: new Date().toISOString()
                }
                setMessages((prev) => [newMessage, ...prev])
            }
        }
        const onSpeechStart = () => setIsSpeaking(true)
        const onSpeechEnd = () => setIsSpeaking(false)
        const onError = (error: any) => console.log("Error", error)

        vapi.on("call-start", onCallStart)
        vapi.on("call-end", onCallEnd)
        vapi.on("message", onMessage)
        vapi.on("error", onError)
        vapi.on('speech-start', onSpeechStart)
        vapi.on('speech-end', onSpeechEnd)

        return () => {
            vapi.off("call-start", onCallStart)
            vapi.off("call-end", onCallEnd)
            vapi.off("message", onMessage)
            vapi.off("error", onError)
            vapi.off('speech-start', onSpeechStart)
            vapi.off('speech-end', onSpeechEnd)
        }
    }, [companionId, hasHistoryPermission, messages])

    const toggleMicrophone = () => {
        const muted = !isMuted;
        vapi.setMuted(muted)
        setIsMuted(muted)
    }

    const handleCall = async (conversationHistory?: SavedMessage[]) => {
        setCallStatus(CallStatus.CONNECTING);
        setShowResumePrompt(false);
        
        // console.log('Starting call with history:', conversationHistory?.length || 0, 'messages');
        
        // Pass the conversation history directly to configureAssistant
        const assistant = configureAssistant(voice, style, selectedLanguage, conversationHistory);
        
        const assistantOverrides = {
            variableValues: { subject, topic, style },
            clientMessages: ['transcript'],
            serverMessages: []
        }
        
        //@ts-expect-error
        vapi.start(assistant, assistantOverrides)
    }
    
    const handleResumeConversation = () => {
        if (savedConversation?.messages && savedConversation.messages.length > 0) {
            const historyForModel = savedConversation.messages.map((msg: any) => ({
                role: msg.role,
                content: msg.content
            }));
            
          
            
            // Set messages for UI (reversed for display newest first)
            setMessages(savedConversation.messages.slice().reverse());
            setIsResuming(true);
        }
        setShowResumePrompt(false);
        
        // Pass the conversation history to handleCall
        handleCall(savedConversation?.messages as SavedMessage[]);
    }
    
    const handleStartFresh = () => {
        setMessages([]);
        setShowResumePrompt(false);
        handleCall(); // No history
    }

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED)        
        vapi.stop()
    }

    // const handleResumeConversation = () => {
    //     if (savedConversation?.messages) {
    //         console.log('Resuming with messages:', savedConversation.messages);
            
    //         const messagesForUI = [...savedConversation.messages].reverse().map((msg: any) => ({
    //             ...msg,
    //             id: msg.id || `${Date.now()}-${Math.random()}`
    //         }));
            
    //         setMessages(messagesForUI);
    //         setIsResuming(true);
            
    //         const historyForAI = savedConversation.messages;
            
    //         console.log('Messages for UI (newest first):', messagesForUI);
    //         console.log('Messages for AI (oldest first):', historyForAI);
            
    //         setShowResumePrompt(false);
    //         handleCall(historyForAI);
    //     }
    // }

    // const handleStartFresh = () => {
    //     setMessages([]);
    //     setIsResuming(false);
    //     setShowResumePrompt(false);
    //     handleCall();
    // }

    const cardClass = "bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8";

    return (
        <section className='grid grid-cols-1 lg:grid-cols-3 gap-6 h-fit'>
            
            {/* Resume Conversation Prompt */}
            {showResumePrompt && savedConversation && (
                <div className="lg:col-span-3 animate-in slide-in-from-top-5 duration-500">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-4 pl-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                        
                        <div className="flex items-center gap-5 w-full md:w-auto">
                            <div className="size-14 rounded-full bg-[#E8FCD9] flex items-center justify-center text-[#22C55E] flex-shrink-0">
                                <MessageCircle size={26} strokeWidth={2.5} />
                            </div>
                            
                            <div className="flex flex-col gap-1">
                                <h3 className="font-bold text-lg text-[#111111] leading-tight">
                                    Previous Conversation Found
                                </h3>
                                <p className="text-slate-500 text-sm font-bold">
                                    {savedConversation.messages.length} messages • Last active:{' '}
                                    {new Date(savedConversation.last_message_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={handleResumeConversation}
                                className="bg-[#111111] text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-md hover:opacity-90 transition-all active:scale-95 whitespace-nowrap flex-1 md:flex-none"
                            >
                                Resume Conversation
                            </button>
                            <button
                                onClick={handleStartFresh}
                                className="bg-white text-[#111111] border border-slate-200 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 whitespace-nowrap flex-1 md:flex-none"
                            >
                                Start Fresh
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade Prompt for Free Users - FIXED CONDITION */}
            {hasHistoryPermission === false && callStatus === CallStatus.INACTIVE && !showResumePrompt && (
                <div className="lg:col-span-3 animate-in slide-in-from-top-5 duration-500">
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
                                    href="/Subscription" 
                                    className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition"
                                >
                                    Upgrade Now
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
             {/* LEFT COLUMN: Monitor (Spans 2 columns) */}
             <div className={cn(cardClass, "lg:col-span-2 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden transition-all")}>
                
                {/* INACTIVE STATE: Big Logo */}
                {(callStatus === CallStatus.INACTIVE || callStatus === CallStatus.CONNECTING || callStatus === CallStatus.FINISHED) && (
                    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-500">
                        <div 
                            className={cn(
                                "size-[200px] rounded-[3rem] flex items-center justify-center transition-all",
                                callStatus === CallStatus.CONNECTING && "animate-pulse scale-105"
                            )}
                            style={{ backgroundColor: `${getSubjectColor(subject)}70` }}
                        >
                             <Image src={`/icons/${subject}.svg`} alt={subject} width={100} height={100} />
                        </div>
                        <div className="text-center space-y-2">
                             <h2 className="text-4xl font-black tracking-tighter">{name}</h2>
                             <p className="text-slate-400 font-medium">Your {subject} Companion</p>
                             {isResuming && callStatus === CallStatus.CONNECTING && (
                                 <p className="text-green-600 text-sm font-bold animate-pulse">
                                     Loading conversation history...
                                 </p>
                             )}
                        </div>
                    </div>
                )}

                {/* ACTIVE STATE: Soundwave Top, Transcript Bottom */}
                {callStatus === CallStatus.ACTIVE && (
                    <div className="w-full h-full flex flex-col animate-in slide-in-from-bottom-5 duration-500">
                        
                        {/* TOP: Lottie Animation */}
                        <div className="flex-1 flex items-center justify-center min-h-[250px]">
                             <div className="size-[300px]">
                                <Lottie 
                                    lottieRef={lottieRef} 
                                    animationData={soundwaves} 
                                    autoplay={false} 
                                    loop={true}
                                    className='w-full h-full' 
                                />
                             </div>
                        </div>

                        {/* BOTTOM: Scrolling Transcript */}
                        <div className="h-[200px] w-full border-t border-slate-100 pt-4 flex flex-col">
                            <div className="flex items-center justify-between mb-2 px-2">
                                <p className="text-xs font-bold text-slate-300 uppercase">
                                    Live Transcript
                                    {isResuming && (
                                        <span className="ml-2 text-green-600">• Resumed Session</span>
                                    )}
                                </p>
                                {hasHistoryPermission && messages.length > 0 && (
                                    <p className="text-xs text-green-600 font-bold">● Auto-saving ({messages.length} msgs)</p>
                                )}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 px-2">
                                {messages.length === 0 && (
                                    <p className="text-center text-slate-300 text-sm italic">Listening...</p>
                                )}
                                {messages.map((msg, index) => (
                                    <div key={msg.id || index} className={cn(
                                        "flex w-full animate-in fade-in slide-in-from-bottom-2",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}>
                                        <div className={cn(
                                            "max-w-[85%] rounded-xl px-4 py-2 text-sm",
                                            msg.role === 'user' 
                                                ? "bg-slate-100 text-slate-700" 
                                                : "text-slate-500 italic"
                                        )}>
                                            <span className="font-bold text-xs mr-2 opacity-50 uppercase">
                                                {msg.role === 'user' ? 'You' : 'AI'}
                                            </span>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </div>


            {/* RIGHT COLUMN: Controls */}
            <div className="flex flex-col gap-6">
                
                {/* User Card */}
                <div className={cn(cardClass, "flex items-center gap-4 py-6")}>
                    <div className="relative">
                        <Image src={userImage} alt={userName} width={60} height={60} className='rounded-2xl object-cover border-2 border-slate-100' />
                        <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Signed in as</p>
                        <p className="text-xl font-bold text-slate-900 leading-none">{userName}</p>
                    </div>
                </div>

                {/* Language Selection */}
                <div className={cn(cardClass, "py-6")}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Globe size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Voice Language</p>
              <p className="text-xs font-medium text-slate-400">
                AI speaks in {SUPPORTED_LANGUAGES[selectedLanguage].name}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              disabled={callStatus === CallStatus.ACTIVE}
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
                selectedLanguage === lang
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100",
                callStatus === CallStatus.ACTIVE && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-lg">{SUPPORTED_LANGUAGES[lang].flag}</span>
              <span>{SUPPORTED_LANGUAGES[lang].name}</span>
            </button>
          ))}
        </div>

        {callStatus === CallStatus.ACTIVE && (
          <p className="text-xs text-slate-400 mt-2 text-center">
            Language locked during active session
          </p>
        )}
      </div>


                {/* Mic Control */}
                <div className={cn(cardClass, "flex items-center justify-between py-6")}>
                    <div className="flex items-center gap-4">
                        <div className={cn("size-12 rounded-full flex items-center justify-center transition-colors", isMuted ? "bg-red-100 text-red-500" : "bg-slate-100 text-black")}>
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">Microphone</p>
                            <p className="text-xs font-medium text-slate-400">{isMuted ? 'Muted' : 'Active'}</p>
                        </div>
                    </div>
                    <button onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE} className="text-[10px] font-bold border border-slate-200 rounded-full px-3 py-1.5 uppercase tracking-wide hover:bg-slate-50 disabled:opacity-50">
                        {isMuted ? 'Turn On' : 'Turn Off'}
                    </button>
                </div>

                {/* Main Action Button */}
                <div className="mt-auto">
        <button 
          className={cn(
            'w-full rounded-full py-6 text-white font-bold text-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl',
            callStatus === CallStatus.ACTIVE ? 'bg-red-500 shadow-red-200' : 'bg-[#111111] shadow-slate-200',
            callStatus === CallStatus.CONNECTING && 'opacity-80 cursor-wait'
          )}
          onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : () => handleCall()}
          disabled={callStatus === CallStatus.CONNECTING}
        >
          {callStatus === CallStatus.ACTIVE ? (
            <><Square fill="currentColor" size={20} /> End Session</>
          ) : callStatus === CallStatus.CONNECTING ? (
            isResuming ? "Resuming..." : "Connecting..."
          ) : (
            <>Start Session <Play fill="currentColor" size={20} /></>
          )}
        </button>
      </div>
            </div>            
        </section>
    )
}

export default CompanionComponent