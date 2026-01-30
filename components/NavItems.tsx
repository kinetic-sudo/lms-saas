'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from "next/navigation"

const navItems = [
    {label: "Home", href: "/"},
    {label: "Companion", href: '/companion'},
    {label: 'My journey', href: "/my-journey"}
]

// Allow custom classes to handle mobile layout
const NavItems = ({ className }: { className?: string }) => {
    const PathName = usePathname();

    return (
        <nav className={cn("flex items-center gap-8", className)}>
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
                        {isActive && (
                            // Only show dot on desktop (default) or handle via parent CSS
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full hidden md:block"></span>
                        )}
                    </Link>
                )
            })}
        </nav>
    )
}

export default NavItems