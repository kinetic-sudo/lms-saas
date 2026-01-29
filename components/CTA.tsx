import { subjects } from '@/constants'
import { getSubjectColor } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const CTA = () => {
  return (
     <section className= "cta-section">
        <div className='cta-badge'>
            Start Learning Your Way
        </div>
        
        <div className="max-w-md flex flex-col gap-4 z-10">
            <h2 className='text-3xl font-bold leading-tight'>
                Build and Personalize<br/>Your Learning Companion
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed px-4">
                Pick a name, subject, voice, & personality - and start learning
                through voice conversations that feel natural and fun.
            </p>
        </div>

         {/* Decorative Icons (optional - simple placeholder for the 3D icons in image) */}
         <div className="flex gap-8  py-4">
            <Image src='/images/cta.svg' alt='cta' width={362} height={232}/>
         </div>

         <Link href='/companion/new'>
             <button className='btn-outline-add'>
                <Image src="/icons/plus.svg" alt= "plus" width={16} height={16}  />
                <span>Create New Companion</span>
             </button>
         </Link>
     </section>
  )
}

export default CTA