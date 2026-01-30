"use client"

import Image from "next/image"
import Link from "next/link"
import NavItems from "./NavItems"
import { SignInButton } from "@clerk/nextjs"
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react"
import { Bell, Search } from "lucide-react" // Make sure to install lucide-react

const Navbar = () => {
  return (
    // Fixed header with blur effect and subtle border
    <header className="fixed top-0 inset-x-0 z-50 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
        <nav className="mx-auto px-6 h-full flex items-center justify-between max-w-7xl">
            
            {/* LEFT: Logo */}
            <Link href="/" className="z-50">
                <div className="flex items-center gap-2.5 cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
                    <Image 
                        src="/images/logo.svg"
                        alt="logo" 
                        width={40} // Adjusted size to match standard navbar proportions
                        height={40}           
                    />
                    <span className="font-bold text-xl tracking-tight hidden md:block">SkillForge</span>
                </div>
            </Link>

            {/* CENTER: Navigation Items (Absolute Center) */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <NavItems />
            </div>

            {/* RIGHT: Actions & Auth */}
            <div className="flex items-center gap-6 z-50">
                {/* Decorative Icons from screenshot */}
                <button className="text-slate-400 hover:text-black transition-colors">
                    <Search size={20} />
                </button>
                <button className="text-slate-400 hover:text-black transition-colors relative">
                    <Bell size={20} />
                    {/* Red dot indicator */}
                    <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                
                {/* Divider */}
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                {/* Clerk Auth */}
                <div className="flex items-center">
                    <SignedOut>
                        <SignInButton>
                            <button className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                                Sign In
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton 
                            appearance={{
                                elements: {
                                    avatarBox: "size-9 border-2 border-slate-100"
                                }
                            }}
                        />
                    </SignedIn>
                </div>
            </div>
        </nav>
    </header>
  )
}

export default Navbar