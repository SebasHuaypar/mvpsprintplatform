'use client'

import { getSupabase, ProjectWithFounders } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, Star, Sparkles } from 'lucide-react'
import { GlassSelect } from '@/components/ui/GlassSelect'

export default function ProjectsGalleryPage() {
    const [projects, setProjects] = useState<ProjectWithFounders[]>([])
    const [loading, setLoading] = useState(true)
    const [categoryFilter, setCategoryFilter] = useState('')
    const [countryFilter, setCountryFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [scrollOpacity, setScrollOpacity] = useState(1)

    useEffect(() => { fetchProjects() }, [])

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            const opacity = Math.max(0, 1 - currentScrollY / 60)
            setScrollOpacity(opacity)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const isInteractive = scrollOpacity > 0.1

    async function fetchProjects() {
        const supabase = getSupabase()
        const { data } = await supabase.from('projects').select('*, founders(*)').eq('status', 'published').order('featured', { ascending: false }).order('created_at', { ascending: false })
        if (data) setProjects(data as ProjectWithFounders[])
        setLoading(false)
    }

    const filteredProjects = projects.filter((p) => {
        if (categoryFilter && p.category !== categoryFilter) return false
        if (countryFilter && p.country !== countryFilter) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return p.name.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q) || p.country?.toLowerCase().includes(q)
        }
        return true
    })

    const categories = [...new Set(projects.map(p => p.category).filter(Boolean))]
    const countries = [...new Set(projects.map(p => p.country).filter(Boolean))]

    const categoryLabels: Record<string, string> = {
        healthtech: 'Healthtech',
        agritech: 'Agritech',
        open_innovation: 'Open Innovation',
    }

    return (
        <div className="min-h-screen">
            {/* Header — clean like original */}
            <header
                className="fixed top-0 inset-x-0 z-50 transition-opacity duration-300"
                style={{
                    opacity: scrollOpacity,
                    pointerEvents: isInteractive ? 'auto' : 'none',
                }}
            >
                <nav className="max-w-6xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/projects" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <Image src="/images/chapters/START Lima White.svg" alt="START Lima" width={100} height={35} className="h-7 w-auto drop-shadow-lg" />
                            <span className="text-white/20 text-xs">|</span>
                            <span className="text-white/60 text-xs font-medium">MVP Sprint</span>
                        </Link>
                        <Link href="/login" className="text-white/40 hover:text-white/70 text-xs font-medium transition-colors">
                            Iniciar Sesión
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero */}
            <section className="pt-28 pb-12 px-6 relative">
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-navy-600/15 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-6xl mx-auto relative">
                    <div className="max-w-xl animate-fade-in-up">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600/8 border border-yellow-600/15 rounded-full text-yellow-500 text-[10px] font-bold tracking-wider uppercase mb-5">
                            <Sparkles className="w-3 h-3" />
                            MVP Sprint 2026
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
                            Proyectos del<br /><span className="text-yellow-500">MVP Sprint</span>
                        </h1>
                        <p className="text-white/35 text-sm font-medium max-w-md">
                            Startups creadas en el programa intensivo de START Lima.
                        </p>
                    </div>
                </div>
            </section>

            {/* Filters */}
            <section className="px-6 pb-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="relative w-full sm:flex-1 sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-glass !pl-9 text-xs" placeholder="Buscar..." />
                        </div>
                        <div className="w-full sm:w-[180px] flex-shrink-0">
                            <GlassSelect
                                value={categoryFilter}
                                onChange={setCategoryFilter}
                                placeholder="Categoría"
                                options={[
                                    { value: '', label: 'Todas las categorías' },
                                    ...categories.map(c => ({
                                        value: c!,
                                        label: categoryLabels[c!] || c!,
                                        icon: c === 'healthtech' ? '🏥' : c === 'agritech' ? '🌱' : c === 'open_innovation' ? '💡' : ''
                                    }))
                                ]}
                            />
                        </div>
                        <div className="w-full sm:w-[140px] flex-shrink-0">
                            <GlassSelect
                                value={countryFilter}
                                onChange={setCountryFilter}
                                placeholder="País"
                                options={[
                                    { value: '', label: 'Todos los países' },
                                    ...countries.map(c => ({ value: c!, label: c! }))
                                ]}
                            />
                        </div>
                        {(categoryFilter || countryFilter || searchQuery) && (
                            <button onClick={() => { setCategoryFilter(''); setCountryFilter(''); setSearchQuery('') }} className="w-full sm:w-auto text-yellow-500/60 hover:text-yellow-500 text-xs font-medium transition-colors text-center py-2 sm:py-0">
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="px-6 pb-20">
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" />
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-white/25 text-sm">No se encontraron proyectos</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProjects.map((project, index) => (
                                <Link key={project.id} href={`/projects/${project.slug}`} className="group glass-card rounded-2xl overflow-hidden hover-lift animate-fade-in-up" style={{ animationDelay: `${0.03 * index}s` }}>
                                    {/* Cover */}
                                    <div className="relative h-40 bg-gradient-to-br from-navy-800 to-navy-900 overflow-hidden">
                                        {project.cover_image_url ? (
                                            <img src={project.cover_image_url} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Sparkles className="w-8 h-8 text-navy-700" />
                                            </div>
                                        )}
                                        {project.featured && (
                                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 bg-yellow-600 text-navy-900 rounded-full text-[10px] font-bold">
                                                <Star className="w-2.5 h-2.5" fill="currentColor" /> Destacado
                                            </div>
                                        )}
                                        {project.category && (
                                            <div className="absolute top-2.5 right-2.5 px-2 py-1 bg-black/40 backdrop-blur-sm text-white/80 rounded-full text-[10px] font-medium">
                                                {categoryLabels[project.category] || project.category}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/6 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {project.logo_url ? <img src={project.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-yellow-600 text-[10px] font-bold">{project.name.charAt(0)}</span>}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-white text-sm font-bold group-hover:text-yellow-500 transition-colors truncate">{project.name}</h3>
                                                {project.country && <p className="text-white/25 text-[10px] flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{project.country}</p>}
                                            </div>
                                        </div>
                                        {project.short_description && <p className="text-white/30 text-xs line-clamp-2">{project.short_description}</p>}

                                        {project.founders && project.founders.length > 0 && (
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                                <div className="flex -space-x-1.5">
                                                    {project.founders.slice(0, 3).map((f, i) => (
                                                        <div key={i} className="w-5 h-5 rounded-full bg-navy-700 border border-navy-900 flex items-center justify-center overflow-hidden">
                                                            {f.photo_url ? <img src={f.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-[8px] font-bold">{f.name.charAt(0)}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-white/20 text-[10px]">{project.founders.length} fundador{project.founders.length !== 1 ? 'es' : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-6 px-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between text-white/20 text-xs">
                    <p>© 2026 START Lima</p>
                    <Link href="/login" className="hover:text-white/40 transition-colors">Panel</Link>
                </div>
            </footer>
        </div>
    )
}
