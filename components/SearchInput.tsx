'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

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
    <div className='relative border border-black rounded-lg items-center flex gap-2 px-2 py-1 h-fit '>
        <Image src="/icons/search.svg" alt='search' width={15} height={15} />
        <input 
         placeholder='Search companion' 
         className='outline-none' 
         value={searchQuery} 
         onChange={(e) => setSearchQuery(e.target.value)}
         />
    </div>
  )
}

export default SearchInput