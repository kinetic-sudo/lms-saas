'use client'

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { toggleBookmark } from "@/lib/action/bookmark.action"



interface CompanionCardProps {
    id: string
    name: string
    topic: string
    subject: string
    duration: number
    color: string
    isBookmarked?: boolean
}

const CompanionCard = ({id, name, topic, subject, duration, color, isBookmarked = false} : CompanionCardProps) => {
  const isDummy = id.startsWith('dummy-');
  const [bookmarked, SetBookmarked] = useState(isBookmarked)
  const [isToggling, SetIsToggling] = useState(false)

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isToggling) return;
  
    SetIsToggling(true)
    const result = await toggleBookmark(id)
    
    if (result.success) {
      SetBookmarked(result.bookmarked)
    } 

    SetIsToggling(false)
  }


  return (
    <article 
      className="companion-card min-w-[300px] relative" 
      style={{
          backgroundColor: `color-mix(in srgb, ${color}, white 85%)`,
          borderColor: `color-mix(in srgb, ${color}, white 80%)`
      }} 
    > 
        {/* Sample badge for dummy companions */}
        {/* {isDummy && (
          <div className="absolute top-4 right-4 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
            Sample
          </div>
        )} */}

        <div className="flex justify-between items-start mb-2">
            <div className='subject-badge'>
                {subject}
            </div>
            {!isDummy && (
              <button 
              className={`companion-bookmark transition-all ${bookmarked ? 'bg-slate-900' : 'bg-white'} ${isToggling ? 'opacity-50' : ''}`}
              onClick={handleBookmark} 
              disabled={isToggling}
               > 
               {bookmarked ? (
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                 <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                 </svg>

               ) : (
                  <Image src="/icons/bookmark.svg" alt="bookmark" width={16} height={16} />
               )}
              </button>
            )}
        </div>

        <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight">{name}</h2>
            <p className="text-black italic font-medium">{topic}</p>
        </div>

        <div className="flex items-center gap-2 mt-1 mb-4">
            <Image src="/icons/clock.svg" alt="duration" width={14} height={14} />
            <p className="text-black text-sm font-semibold">{duration} Minutes</p>
        </div>

        {isDummy ? (
          <Link href="/companion/new" className="w-full mt-auto">
            <button className="btn-primary">
              Create Your Own
            </button>
          </Link>
        ) : (
          <Link href={`/companion/${id}`} className="w-full mt-auto">
            <button className="btn-primary">
              Launch Lesson 
            </button>
          </Link>
        )}
    </article>
  )
}

export default CompanionCard