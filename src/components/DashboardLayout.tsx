'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    LayoutDashboard,
    FileEdit,
    Shield,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Globe,
} from 'lucide-react'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/project/edit', label: 'Mi Proyecto', icon: FileEdit },
    { href: '/projects', label: 'Galería', icon: Globe },
]

const adminItems = [
    { href: '/admin', label: 'Admin', icon: Shield },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, profile, loading, signOut, isAdmin } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrollOpacity, setScrollOpacity] = useState(1)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            const opacity = Math.max(0, 1 - currentScrollY / 60)
            setScrollOpacity(opacity)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" />
            </div>
        )
    }

    const allNavItems = [...navItems, ...(isAdmin ? adminItems : [])]
    const isInteractive = scrollOpacity > 0.1

    function handleSignOut() {
        signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen">
            {/* Top Navbar — clean like original Header.tsx */}
            <header
                className="fixed top-0 inset-x-0 z-50 transition-opacity duration-300"
                style={{
                    opacity: scrollOpacity,
                    pointerEvents: isInteractive ? 'auto' : 'none',
                }}
            >
                <nav className="max-w-6xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex-shrink-0 hover:opacity-80 transition-opacity">
                            <Image
                                src="/images/chapters/START Lima White.svg"
                                alt="START Lima"
                                width={100}
                                height={35}
                                className="h-7 w-auto drop-shadow-lg"
                            />
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-1">
                            {allNavItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                                            ? 'bg-yellow-600/10 text-yellow-500'
                                            : 'text-white/60 hover:text-white'
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                )
                            })}

                            {/* Separator */}
                            <div className="w-px h-5 bg-white/10 mx-2" />

                            {/* User info + logout */}
                            <div className="flex items-center gap-3">
                                <span className="text-white/40 text-xs font-medium">
                                    {profile?.full_name || profile?.email?.split('@')[0]}
                                </span>
                                <button
                                    onClick={handleSignOut}
                                    className="text-white/40 hover:text-white/70 transition-colors p-1.5"
                                    title="Cerrar sesión"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-white/70 hover:text-yellow-500 transition-colors p-2"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu — glassmorphism dropdown like original */}
                {mobileMenuOpen && (
                    <div className="md:hidden">
                        <div className="mx-6 mt-1 bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                            <div className="flex flex-col p-4 space-y-1">
                                {allNavItems.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                                                ? 'bg-yellow-600/10 text-yellow-500'
                                                : 'text-white/70 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.label}
                                            {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                                        </Link>
                                    )
                                })}

                                <div className="border-t border-white/5 my-2" />

                                {/* User info */}
                                <div className="px-4 py-2">
                                    <p className="text-white/40 text-xs font-medium">
                                        {profile?.full_name || profile?.email}
                                    </p>
                                </div>

                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content — full width, no sidebar */}
            <main className="pt-16 min-h-screen">
                {children}
            </main>
        </div>
    )
}
