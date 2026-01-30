'use client'

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sdk';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import soundwaves from '../constants/soundwaves.json'
import { addToSessionHistory } from '@/lib/action/companion.action';
import { Mic, MicOff, Play, Square } from 'lucide-react';

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
}

interface SavedMessage {
    id: string;
    role: string;
    content: string;
}

const CompanionComponent = ({ companionId, subject, topic, name, userName, userImage, style, voice }: CompanionComponentProps) => {

    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false)
    const [messages, setMessage] = useState<SavedMessage[]>([])

    const lottieRef = useRef<LottieRefCurrentProps>(null);

    // --- Lottie Animation Logic ---
    useEffect(() => {
        if (lottieRef.current) {
            // Play animation ONLY when AI is speaking
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
        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
            addToSessionHistory(companionId)
        }
        const onMessage = (message: any) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage = {
                    id: `${Date.now()}-${Math.random()}`,
                    role: message.role,
                    content: message.transcript
                }
                setMessage((prev) => [newMessage, ...prev,])
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
    }, [companionId])

    const toggleMicrophone = () => {
        const muted = !isMuted;
        vapi.setMuted(muted)
        setIsMuted(muted)
    }

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING)
        const assistantOverides = {
            variableValues: { subject, topic, style },
            clientMessages: ['transcript'],
            serverMessages: []
        }
        //@ts-expect-error
        vapi.start(configureAssistant(voice, style), assistantOverides)
    }

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED)
        vapi.stop()
    }

    const cardClass = "bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8";

    return (
        <section className='grid grid-cols-1 lg:grid-cols-3 gap-6 h-fit'>
            
            {/* LEFT COLUMN: Monitor (Spans 2 columns) */}
            <div className={cn(cardClass, "lg:col-span-2 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden transition-all")}>
                
                {/* 1. INACTIVE STATE: Big Logo */}
                {(callStatus === CallStatus.INACTIVE || callStatus === CallStatus.CONNECTING || callStatus === CallStatus.FINISHED) && (
                    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-500">
                        <div 
                            className={cn(
                                "size-[200px] rounded-[3rem] flex items-center justify-center transition-all",
                                callStatus === CallStatus.CONNECTING && "animate-pulse scale-105"
                            )}
                            style={{ backgroundColor: `${getSubjectColor(subject)}15` }}
                        >
                             <Image src={`/icons/${subject}.svg`} alt={subject} width={100} height={100} />
                        </div>
                        <div className="text-center space-y-2">
                             <h2 className="text-4xl font-black tracking-tighter">{name}</h2>
                             <p className="text-slate-400 font-medium">Your {subject} Companion</p>
                        </div>
                    </div>
                )}

                {/* 2. ACTIVE STATE: Soundwave Top, Transcript Bottom */}
                {callStatus === CallStatus.ACTIVE && (
                    <div className="w-full h-full flex flex-col animate-in slide-in-from-bottom-5 duration-500">
                        
                        {/* TOP: Lottie Animation (Main Focus) */}
                        <div className="flex-1 flex items-center justify-center min-h-[250px]">
                             <div className="size-[300px]"> {/* Control size of animation here */}
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
                            <p className="text-xs font-bold text-slate-300 uppercase mb-2 text-center">Live Transcript</p>
                            
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 px-2">
                                {messages.length === 0 && (
                                    <p className="text-center text-slate-300 text-sm italic">Listening...</p>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={cn(
                                        "flex w-full animate-in fade-in slide-in-from-bottom-2",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}>
                                        <div className={cn(
                                            "max-w-[85%] rounded-xl px-4 py-2 text-sm",
                                            msg.role === 'user' 
                                                ? "bg-slate-100 text-slate-700" 
                                                : "text-slate-500 italic" // AI text looks distinct
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


            {/* RIGHT COLUMN: Controls (Unchanged) */}
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
                    <button onClick={toggleMicrophone} className="text-[10px] font-bold border border-slate-200 rounded-full px-3 py-1.5 uppercase tracking-wide hover:bg-slate-50">
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
                        onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                        disabled={callStatus === CallStatus.CONNECTING}
                    >
                        {callStatus === CallStatus.ACTIVE ? (
                            <><Square fill="currentColor" size={20} /> End Session</>
                        ) : callStatus === CallStatus.CONNECTING ? (
                            "Connecting..."
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