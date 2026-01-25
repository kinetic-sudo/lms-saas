interface CompanionCardProps {
    id: string
    name: string
    topic: string
    subject: string
    duration: number
    color: string
    
}

const CompanionCard = ({id, name, topic, subject, duration, color} : CompanionCardProps) => {
  return (
    <article className="companion-card" style={{background: color}}>

    </article>
  )
}

export default CompanionCard