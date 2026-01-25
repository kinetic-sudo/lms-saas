"use client"

import Image from "next/image"
import Link from "next/link"
import NavItems from "./NavItems"

const Navbar = () => {


  return (
    <nav className="navbar">
        <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
            <Image 
             src="/images/logo.svg"
             alt="logo" 
             width={46}
             height={44}           
            />
        </div>
        </Link>
        <div className="flex gap-8 items-center">
            <NavItems />
            <p>Sign In</p>
        </div>
    </nav>
  )
}

export default Navbar