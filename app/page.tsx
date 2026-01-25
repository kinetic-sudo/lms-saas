import CompanionCard from '@/components/CompanionCard'
import CompanionList from '@/components/CompanionList'
import CTA from '@/components/CTA'
import { Button } from '@/components/ui/button'
import React from 'react'

const Page = () => {
  return (
    <main>
      <h1>Popular Companion</h1>
      <section className='home-section'>
        <CompanionCard 
          id = "1234"
          name = 'Neura the brainy explorer'
          topic = 'Nueral network of the brain'
          subject = 'Science'
          duration = {45}
          color = "#ffda6e"
        />
          <CompanionCard 
          id = "4567"
          name = 'Countsy the number wizard'
          topic = 'Derivates & integrals'
          subject = 'Maths'
          duration = {30}
          color = "#e5d0ff"
        />
           <CompanionCard 
          id = "789"
          name = 'Verba and vocabalary builder'
          topic = 'English Literature'
          subject = 'Language'
          duration = {30}
          color = "#BDE7FF"
        />
      </section>
      
      <section className='home-section'>
        <CompanionList />
        <CTA />
      </section>
    </main>
  )
}

export default Page