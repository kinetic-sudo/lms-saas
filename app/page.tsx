// app/page.tsx - ENHANCED VERSION
export const dynamic = "force-dynamic";

import CompanionCard from '@/components/CompanionCard'
import CompanionList from '@/components/CompanionList'
import CTA from '@/components/CTA'
import Hero from '@/components/hero' // NEW
import Features from '@/components/feature' // NEW
import Testimonials from '@/components/testimonial' // NEW
import { getAllCompanions, getRecentSessionsForHome } from '@/lib/action/companion.action'
import { getBookmarkedCompanions, getUserBookmarkIds } from '@/lib/action/bookmark.action'
import { getSubjectColor } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'

const Page = async () => {
  const companions = await getAllCompanions({limit: 3}) 
  const recentSessionsCompanions = await getRecentSessionsForHome(3)
  const bookmarkedCompanions = await getBookmarkedCompanions(3)
  const bookmarkIds = await getUserBookmarkIds()
  
  return (
    <main>
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* Bookmarked Section */}
      {bookmarkedCompanions && bookmarkedCompanions.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="section-header">
              <h2 className="section-title">Your Bookmarked Companions</h2>
              <Link href='/companion?filter=bookmarked' className="section-link">See all</Link>
            </div>
            
            <div className='flex flex-col md:flex-row items-start md:items-center gap-4 overflow-x-auto pb-4 no-scrollbar'>
              {bookmarkedCompanions.map((companion) => (
                <CompanionCard 
                  key={companion.id}
                  color={getSubjectColor(companion.subject)} 
                  {...companion}
                  isBookmarked={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Companions Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="section-header">
            <h2 className="section-title">Popular Companions</h2>
            <Link href='/companion' className="section-link">See all</Link>
          </div>
          
          <div className='flex flex-col md:flex-row items-start md:items-center gap-4 overflow-x-auto pb-4 no-scrollbar'>
            {companions && companions.length > 0 ? (
              companions.map((companion) => (
                <CompanionCard 
                  key={companion.id}
                  color={getSubjectColor(companion.subject)} 
                  {...companion}
                  isBookmarked={bookmarkIds.includes(companion.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 w-full">
                <p className="text-slate-600">No companions available</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />
      
      {/* Recent Sessions & CTA */}
      <section className='py-16 bg-white'>
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-16">
          {recentSessionsCompanions && recentSessionsCompanions.length > 0 ? (
            <CompanionList 
              title="Recently Completed"
              companions={recentSessionsCompanions}
              showHistory={true}
              historyLink="/my-journey"
            />
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-3xl">
              <p className="text-slate-600 font-medium mb-4">No recent sessions yet</p>
              <Link href="/companion/new" className="text-indigo-600 font-bold hover:underline text-lg">
                Create your first companion to get started
              </Link>
            </div>
          )}
          
          <CTA />
        </div>
      </section>
    </main>
  )
}

export default Page