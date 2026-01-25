import CompanionCard from '@/components/CompanionCard'
import CompanionList from '@/components/CompanionList'
import CTA from '@/components/CTA'
import { Button } from '@/components/ui/button'
import React from 'react'

const Page = () => {
  return (
    <main>
      <h1 className='text-2xl underline '>Popular Companion</h1>
      <section className='home-section'>
        <CompanionCard />
        <CompanionCard />
        <CompanionCard />
      </section>
      
      <section className='home-secton'>
        <CompanionList />
        <CTA />
      </section>
    </main>
  )
}

export default Page