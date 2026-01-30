import CompanionCard from '@/components/CompanionCard'
import CompanionList from '@/components/CompanionList'
import CTA from '@/components/CTA'
import { getAllCompanions, getRecentSession } from '@/lib/action/companion.action'
import { getSubjectColor } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'

const Page = async () => {
  const companions = await getAllCompanions({limit: 3}) 
  const recentSessionsCompanions = await getRecentSession()

  return (
    <main>
      {/* Popular Section */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Popular Companions</h2>
          <Link href='/companion' className="section-link">See all</Link>
        </div>
        
        <div className='flex gap-4 overflow-x-auto pb-4 no-scrollbar'>
          {companions.map((companion) => (
            <CompanionCard 
               key={companion.id}
               color={getSubjectColor(companion.subject)} 
               {...companion}
            />
          ))}
        </div>
      </section>
      
      {/* Recent & CTA Section */}
      <section className='flex flex-col gap-8'>
        <CompanionList 
          title="Recently Completed"
          companions={recentSessionsCompanions}
        />
        <CTA />
      </section>
    </main>
  )
}

export default Page