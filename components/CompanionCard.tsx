import Link from "next/link"
import Image from "next/image"

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
    <article 
    className="companion-card min-w-[300px]" 
    style={{
        // "color-mix" creates a solid pastel tint (no transparency issues)
        // This matches the "creamy" look of the design
        backgroundColor: `color-mix(in srgb, ${color}, white 85%)`,
        // Make the border slightly darker than the background for definition
        borderColor: `color-mix(in srgb, ${color}, white 80%)`
    }} 
> 
        <div className="flex justify-between items-start mb-2">
            <div className='subject-badge'>
                {subject}
            </div>
            {/* Using simple text/icon for bookmark to match clean look */}
            <button className="companion-bookmark">
                <Image src="/icons/bookmark.svg" alt="bookmark" width={16} height={16} />
            </button>
        </div>

        <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight">{name}</h2>
            <p className="text-black italic font-medium">{topic}</p>
        </div>

        <div className="flex items-center gap-2 mt-1 mb-4">
            <Image src="/icons/clock.svg" alt="duration" width={14} height={14} />
            <p className="text-black text-sm font-semibold">{duration} Minutes</p>
        </div>

        <Link href={`/companion/${id}`} className="w-full mt-auto" >
          <button className="btn-primary">
            Launch Lesson 
          </button>
        </Link>
    </article>
  )
}

export default CompanionCard