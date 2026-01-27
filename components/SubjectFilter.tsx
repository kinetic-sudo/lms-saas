'use client'

import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from './ui/select'
import { subjects } from '@/constants'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'


const SubjectFilter = () => {

    const pathname =  usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const subjecQuery = searchParams.get('subject') || ''

    const [searchQuery, setSearchQuery] = useState(subjecQuery)



    useEffect(() => {
        const delayDebouncefn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            
                    if(searchQuery) {
                        params.set('subject', searchQuery)
                    } else (
                        params.delete('subject')
                    )

                    const queryString = params.toString()
                    router.push(queryString ? `${pathname}?${queryString}` : pathname)

        }, 300)

        return () => clearTimeout(delayDebouncefn)
     }, [router, searchQuery, pathname])

  return (
        <Select onValueChange={setSearchQuery} value={searchQuery}>
            <SelectTrigger className='w-full max-w-48 border border-black rounded-lg'>
                
                <SelectValue placeholder="Select Subject"/>

            </SelectTrigger>
            <SelectContent >
                {subjects.map((subject) => (
                    <SelectItem
                     value={subject}
                     key={subject}
                     className='capitalize'
                    >
                        {subject}
                   </SelectItem>
                ))}
            </SelectContent>
        </Select>

  )
}

export default SubjectFilter


