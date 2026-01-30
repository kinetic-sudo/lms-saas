import { cn, getSubjectColor } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface CompanionProps {
  title: string;
  companions?: any[];
  classNames?: string;
  showHistory?: boolean; // New prop
  historyLink?: string; // New prop
}

const CompanionList = ({
  title, 
  companions, 
  classNames, 
  showHistory = false, 
  historyLink = "/my-journey"
}: CompanionProps) => {
  return (
    <article className={cn("w-full", classNames)}>
        <div className="section-header">
             <h2 className="section-title">{title}</h2>
             {showHistory && (
                <Link href={historyLink} className="section-link">
                    History
                </Link>
             )}
        </div>

        <div className="recent-list-container">
            {companions && companions.length > 0 ? (
                companions.map(({id, subject, topic, duration, name}) => (
                    <Link href={`/companion/${id}`} key={id} className="w-full">
                       <div className="recent-item">
                            <div className="flex items-center gap-4">
                                {/* Icon Box */}
                                <div 
                                    className="recent-icon-box" 
                                    style={{
                                        backgroundColor: `${getSubjectColor(subject)}`, 
                                        color: getSubjectColor(subject)
                                    }}
                                >
                                    <Image src={`/icons/${subject}.svg`} alt={subject} width={24} height={24}/>
                                </div>

                                {/* Text Info */}
                                <div className="flex flex-col">
                                    <p className="font-bold text-lg text-black leading-tight">
                                        {name}
                                    </p>
                                    <p className="text-gray-400 text-xs font-medium mt-0.5">
                                        {duration} mins • {subject}
                                    </p>
                                </div>
                            </div>

                            {/* Right Arrow */}
                            <div className="text-gray-300 pr-2">
                                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </div>
                       </div>
                    </Link>
                ))
            ) : (
                <div className="text-center py-8 text-gray-400">
                    <p>No recent sessions yet</p>
                    <Link href="/companion" className="text-indigo-500 font-bold hover:underline mt-2 inline-block">
                        Start your first session
                    </Link>
                </div>
            )}
        </div>
    </article>
  )
}

export default CompanionList