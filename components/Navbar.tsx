"use client"

import Image from "next/image"
import Link from "next/link"
import NavItems from "./NavItems"
import {  SignInButton } from "@clerk/nextjs"
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react"

const Navbar = () => {


  return (
    <nav className="navbar">
        <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
            <Image 
             src="/images/logo.svg"
             alt="logo" 
             width={86}
             height={44}           
            />
        </div>
        </Link>
        <div className="flex gap-5 items-center">
            <NavItems />
            <SignedOut>
                <SignInButton >
                    <button className="btn-signin">Sign In</button>
                </SignInButton>
            </SignedOut>
            <SignedIn>
                <UserButton/>
            </SignedIn>
        </div>
    </nav>
  )
}

export default Navbar