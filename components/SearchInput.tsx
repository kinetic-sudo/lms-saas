'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react' // Recommend using Lucide icons if available, otherwise Image is fine

const SearchInput = () => {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get('topic') || '';

    const [searchQuery, setSearchQuery] = useState(query)

    useEffect(() => {
        const delayDebouncefn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())

            if(searchQuery) {
                params.set('topic', searchQuery)
            } else {
                params.delete('topic')
            }

            const queryString = params.toString()
            router.push(queryString ? `${pathname}?${queryString}` : pathname)
        },  300); 

        return() => clearTimeout(delayDebouncefn)

    }, [searchQuery, router,  pathname])

  return (
    <div className='relative flex items-center w-full md:w-[300px]'>
        {/* Icon positioned absolute */}
        <div className="absolute left-4 opacity-40">
            <Image src="/icons/search.svg" alt='search' width={16} height={16} />
        </div>
        
        <input 
         placeholder='Search companions...' 
         className='w-full bg-slate-100 border-none outline-none focus:ring-2 focus:ring-black/5 rounded-full py-3 pl-11 pr-4 text-sm font-medium transition-all placeholder:text-slate-400' 
         value={searchQuery} 
         onChange={(e) => setSearchQuery(e.target.value)}
         />
    </div>
  )
}

export default SearchInput