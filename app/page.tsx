import CompanionCard from '@/components/CompanionCard'
import CompanionList from '@/components/CompanionList'
import CTA from '@/components/CTA'
import { Button } from '@/components/ui/button'
import { recentSessions } from '@/constants'
import { getAllCompanions, getRecentSession } from '@/lib/action/companion.action'
import { getSubjectColor } from '@/lib/utils'
import React from 'react'

const Page = async () => {

  const companions = await getAllCompanions({limit: 3})
  const recentSessionsCompanions = await getRecentSession(10)



  return (
    <main>
      <h1>Popular Companion</h1>
      <section className='home-section'>

        {companions.map((companion) => (
        <CompanionCard 
           key={companion.id}
           color={getSubjectColor(companion.subject)}
           {...companion}
        />
        ))}

      </section>
      
      <section className='home-section'>
        <CompanionList 
          title = "Recently completed session"
          companions = {recentSessionsCompanions}
          classNames = "w-2/3 max-lg:w-full mb-[1rem]" 
        />
        <CTA />
      </section>
    </main>
  )
}

export default Page