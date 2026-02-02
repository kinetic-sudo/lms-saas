"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import NavItems from "./NavItems"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Bell, Search, Menu, X, CreditCard } from "lucide-react"
import { UserProfileSubscription } from "@/components/UserProfileSubscription" // Custom Component

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
        <nav className="mx-auto px-6 h-full flex items-center justify-between max-w-7xl">
            
            {/* LEFT: Logo */}
            <Link href="/" className="z-50">
                <div className="flex items-center gap-2.5 cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
                    <Image 
                        src="/images/logo.svg"
                        alt="logo" 
                        width={40}
                        height={40}           
                    />
                    <span className="font-bold text-xl tracking-tight hidden lg:block">SkillForge</span>
                </div>
            </Link>

            {/* CENTER: Desktop Navigation */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <NavItems />
            </div>

            {/* RIGHT: Actions & Auth */}
            <div className="flex items-center gap-4 sm:gap-6 z-50">
                
                {/* Icons */}
                <button className="text-slate-400 hover:text-black transition-colors hidden sm:block">
                    <Search size={20} />
                </button>
                <button className="text-slate-400 hover:text-black transition-colors relative hidden sm:block">
                    <Bell size={20} />
                    {/* Notification Dot */}
                    <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                {/* Auth Buttons */}
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
                                    avatarBox: "size-9 border-2 border-slate-100",
                                    // OPTIONAL: Try to hide billing via class if Clerk exposes it
                                    // scrollBox: "no-scrollbar"
                                } 
                            }}
                        >
                            {/* Insert Your Custom Subscription Tab */}
                            <UserButton.UserProfilePage 
                                label="Subscription" 
                                labelIcon={<CreditCard size={15} />} 
                                url="subscription"
                            >
                                <UserProfileSubscription />
                            </UserButton.UserProfilePage>

                        </UserButton>
                    </SignedIn>
                </div>

                {/* Mobile Toggle */}
                <button 
                    className="md:hidden text-slate-500 hover:text-black ml-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 shadow-xl p-6 flex flex-col animate-in slide-in-from-top-5">
                <NavItems className="flex-col items-start gap-6 text-lg" />
                <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-100">
                     <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Search size={20} /> Search
                     </div>
                     <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Bell size={20} /> Notifications
                     </div>
                </div>
            </div>
        )}
    </header>
  )
}

export default Navbar