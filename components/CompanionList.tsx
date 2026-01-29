import { cn, getSubjectColor } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface CompanionProps {
  title: string;
  companions?: any[]; // specific type if you have it
  classNames?: string 
}

const CompanionList = ({title, companions, classNames} : CompanionProps ) => {
  return (
    <article className={cn("w-full", classNames)}>
        <div className="section-header">
             <h2 className="section-title">{title}</h2>
             <span className="section-link">History</span>
        </div>

        <div className="recent-list-container">
            {companions?.map(({id, subject, topic, duration, name}) => (
                <Link href={`/companion/${id}`} key={id} className="w-full">
                   <div className="recent-item">
                        <div className="flex items-center gap-4">
                            {/* Icon Box */}
                            <div 
                                className="recent-icon-box" 
                                style={{
                                    backgroundColor: `${getSubjectColor(subject)}`, // 15% opacity bg
                                    color: getSubjectColor(subject)
                                }}
                            >
                                {/* Assuming you have subject icons. Adjust sizing as needed */}
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
                             {/* You can use an icon library or a simple svg */}
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                   </div>
                </Link>
            ))}
        </div>
    </article>
  )
}

export default CompanionList