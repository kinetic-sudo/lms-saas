import Link from 'next/link'
import React from 'react'

const navItems = [
    {label: "Home", href: "/"},
    {label: "Companion", href: '/companion'},
    {label: 'My journey', href: "/my-journey"}
]


const NavItems = () => {
  return (
    <nav className='flex items-center gap-4'>
        {navItems.map(({label, href}) => (
            <Link href={href} key={label}>
                {label}
            </Link>
        ))}
        <div >

        </div>
    </nav>
  )
}

export default NavItems