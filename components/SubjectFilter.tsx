'use client'

import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from './ui/select'
import { subjects } from '@/constants'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'


const SubjectFilter = () => {

    const pathname =  usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const subjecQuery = searchParams.get('subject') || 'all'

    const [subject, setSubject] = useState(subjecQuery)



    useEffect(() => {
        const delayDebouncefn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            
                    if(subject && subject !== 'all') {
                        params.set('subject', subject)
                    } else (
                        params.delete('subject')
                    )

                    const queryString = params.toString()
                    router.push(queryString ? `${pathname}?${queryString}` : pathname)

        }, 300)

        return () => clearTimeout(delayDebouncefn)
     }, [subject, router, pathname])

  return (
    <Select onValueChange={setSubject} value={subject}>
    <SelectTrigger className='input capitalize'>
        <SelectValue placeholder="Select Subject"/>
    </SelectTrigger>
    <SelectContent position="popper" sideOffset={5}>
        <SelectItem value='all'>All subjects</SelectItem>
        {subjects.map((subject) => (
            <SelectItem key={subject} value={subject} className='capitalize'>
                {subject}
            </SelectItem>
        ))}
    </SelectContent>
</Select>

  )
}

export default SubjectFilter


