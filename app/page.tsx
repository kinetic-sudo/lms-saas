export const dynamic = "force-dynamic";

import CompanionCard from '@/components/CompanionCard'
import CompanionList from '@/components/CompanionList'
import CTA from '@/components/CTA'
import { getAllCompanions, getRecentSessionsForHome } from '@/lib/action/companion.action'
import { getSubjectColor } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'

const Page = async () => {
  
  const companions = await getAllCompanions({limit: 3}) 
  const recentSessionsCompanions = await getRecentSessionsForHome(3)
  
  const hasDummyData = companions.some(c => c?.id?.startsWith('dummy-'));
  
  return (
    <main>
      {/* Popular Section */}
      <section>
        <div className="section-header">
          <h2 className="section-title">
            Popular Companions
          </h2>
          <Link href='/companion' className="section-link">See all</Link>
        </div>
        
        <div className='flex gap-4 overflow-x-auto pb-4 no-scrollbar'>
          {companions && companions.length > 0 ? (
            companions.map((companion) => (
              <CompanionCard 
                key={companion.id}
                color={getSubjectColor(companion.subject)} 
                {...companion}
              />
            ))
          ) : (
            <div className="text-center py-8 w-full">
              <p className="text-slate-600">No companions available</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Recent & CTA Section */}
      <section className='flex flex-col gap-8'>
        {recentSessionsCompanions && recentSessionsCompanions.length > 0 ? (
          <CompanionList 
            title="Recently Completed"
            companions={recentSessionsCompanions}
            showHistory={true}
            historyLink="/my-journey"
          />
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-3xl">
            <p className="text-slate-600 font-medium">No recent sessions yet</p>
            <Link href="/companion/new" className="text-indigo-600 font-bold hover:underline mt-2 inline-block">
              Create your first companion to get started
            </Link>
          </div>
        )}
        <CTA />
      </section>
    </main>
  )
}

export default Page