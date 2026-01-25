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
    <nav className='flex items-center gap-4'>
        {navItems.map(({label, href}) => (
            <Link href={href} key={label} className={cn(PathName === href && "text-primary font-semibold")}>
                {label}
            </Link>
        ))}
        <div >

        </div>
    </nav>
  )
}

export default NavItems