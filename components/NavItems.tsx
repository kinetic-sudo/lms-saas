'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from "next/navigation"

const navItems = [
    {label: "Home", href: "/"},
    {label: "Companion", href: '/companion'},
    {label: 'My journey', href: "/my-journey"}
]

const NavItems = () => {
    const PathName = usePathname();

    return (
        <nav className='flex items-center gap-8'>
            {navItems.map(({label, href}) => {
                const isActive = PathName === href;
                return (
                    <Link 
                        href={href} 
                        key={label} 
                        className={cn(
                            "text-sm font-medium transition-colors duration-200 relative",
                            isActive ? "text-black font-bold" : "text-slate-500 hover:text-black"
                        )}
                    >
                        {label}
                        {/* Active Indicator Dot (Optional, adds a nice touch) */}
                        {isActive && (
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"></span>
                        )}
                    </Link>
                )
            })}
        </nav>
    )
}

export default NavItems