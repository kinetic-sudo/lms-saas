'use client'

import { subjects } from '@/constants'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const SubjectFilter = () => {
    const pathname =  usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSubject = searchParams.get('subject') || 'all'

    const handleSelect = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        
        if(value && value !== 'all') {
            params.set('subject', value)
        } else {
            params.delete('subject')
        }

        const queryString = params.toString()
        router.push(queryString ? `${pathname}?${queryString}` : pathname)
    }

    const allOptions = ['all', ...subjects];

    return (
        <div className="flex flex-wrap gap-2">
            {allOptions.map((item) => {
                const isActive = (item === 'all' && !searchParams.get('subject')) || currentSubject === item;
                
                return (
                    <button
                        key={item}
                        onClick={() => handleSelect(item)}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold capitalize transition-all border",
                            isActive 
                                ? "bg-black text-white border-black" 
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                    >
                        {item === 'all' ? 'All Subjects' : item}
                    </button>
                )
            })}
        </div>
    )
}

export default SubjectFilter