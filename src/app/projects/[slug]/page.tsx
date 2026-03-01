'use client'

import { getSupabase, ProjectWithFounders } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ExternalLink, MapPin, Play, Rocket, Linkedin, Instagram, Star, Users } from 'lucide-react'

export default function ProjectPage() {
    const params = useParams()
    const slug = params.slug as string
    const [project, setProject] = useState<ProjectWithFounders | null>(null)
    const [loading, setLoading] = useState(true)
    const [scrollOpacity, setScrollOpacity] = useState(1)

    useEffect(() => { if (slug) fetchProject() }, [slug])

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            // Fades out faster (after 60px of scroll)
            const opacity = Math.max(0, 1 - currentScrollY / 60)
            setScrollOpacity(opacity)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const isInteractive = scrollOpacity > 0.1

    async function fetchProject() {
        const supabase = getSupabase()
        const { data } = await supabase.from('projects').select('*, founders(*)').eq('slug', slug).eq('status', 'published').single()
        if (data) setProject(data as ProjectWithFounders)
        setLoading(false)
    }

    function getVideoEmbedUrl(url: string): string | null {
        const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/)
        if (yt) return `https://www.youtube.com/embed/${yt[1]}`
        const loom = url.match(/loom\.com\/share\/([^?\s]+)/)
        if (loom) return `https://www.loom.com/embed/${loom[1]}`
        return null
    }

    const categoryLabels: Record<string, string> = { healthtech: 'Healthtech', agritech: 'Agritech', open_innovation: 'Open Innovation' }
    const productStatusLabels: Record<string, string> = { prototype: 'Prototipo', beta: 'Beta', live: 'Live' }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" /></div>

    if (!project) return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">No encontrado</h2>
                <p className="text-white/30 text-sm mb-6">Este proyecto no existe o aún no ha sido publicado.</p>
                <Link href="/projects" className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-600 text-navy-900 text-sm font-bold rounded-full hover:bg-yellow-500 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Galería
                </Link>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header
                className="fixed top-0 inset-x-0 z-50 transition-opacity duration-300"
                style={{
                    opacity: scrollOpacity,
                    pointerEvents: isInteractive ? 'auto' : 'none',
                }}
            >
                <nav className="max-w-6xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/projects" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs font-medium transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Galería
                        </Link>
                        <Link href="/projects">
                            <Image src="/images/chapters/START Lima White.svg" alt="START Lima" width={80} height={28} className="h-5 w-auto opacity-50 hover:opacity-80 transition-opacity" />
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero */}
            <section className="pt-24 pb-12 px-6 relative overflow-hidden">
                {project.cover_image_url && (
                    <div className="absolute inset-0">
                        <img src={project.cover_image_url} alt="" className="w-full h-full object-cover opacity-15 blur-2xl scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/90 to-navy-900" />
                    </div>
                )}
                <div className="max-w-3xl mx-auto relative animate-fade-in-up">
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/6 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {project.logo_url ? <img src={project.logo_url} alt={project.name} className="w-full h-full object-cover" /> : <Rocket className="w-7 h-7 text-yellow-600" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                {project.featured && <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-600 text-navy-900 rounded-full text-[10px] font-bold"><Star className="w-2.5 h-2.5" fill="currentColor" />Destacado</span>}
                                {project.category && <span className="px-2 py-0.5 bg-white/6 text-white/60 rounded-full text-[10px] font-medium">{categoryLabels[project.category] || project.category}</span>}
                                {project.product_status && <span className="px-2 py-0.5 bg-white/6 text-white/60 rounded-full text-[10px] font-medium">{productStatusLabels[project.product_status] || project.product_status}</span>}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{project.name}</h1>
                            {project.country && <p className="text-white/30 text-sm flex items-center gap-1.5 mb-2"><MapPin className="w-3.5 h-3.5 text-yellow-600/60" />{project.country}</p>}
                            {project.short_description && <p className="text-white/40 text-sm font-medium max-w-lg">{project.short_description}</p>}

                            {project.founders && project.founders.length > 0 && (
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="flex -space-x-1.5">
                                        {project.founders.map((f, i) => (
                                            <div key={i} className="w-7 h-7 rounded-full bg-navy-700 border-2 border-navy-900 flex items-center justify-center overflow-hidden">
                                                {f.photo_url ? <img src={f.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-[10px] font-bold">{f.name.charAt(0)}</span>}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-white/25 text-xs">{project.founders.map(f => f.name).join(', ')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Description */}
            {project.long_description && (
                <section className="px-6 pb-12">
                    <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="glass-card rounded-2xl p-6 sm:p-8">
                            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Problema & Solución</h2>
                            <div className="text-white/50 leading-relaxed text-sm whitespace-pre-line">{project.long_description}</div>
                        </div>
                    </div>
                </section>
            )}

            {/* Demo */}
            {project.demo_url && (
                <section className="px-6 pb-12">
                    <div className="max-w-3xl mx-auto text-center animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 text-navy-900 font-bold text-sm rounded-full transition-all duration-200 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-600/20">
                            Probar Demo <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                    </div>
                </section>
            )}

            {/* Video */}
            {project.video_url && (
                <section className="px-6 pb-12">
                    <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="rounded-2xl overflow-hidden border border-white/6 aspect-video bg-navy-800">
                            {getVideoEmbedUrl(project.video_url) ? (
                                <iframe src={getVideoEmbedUrl(project.video_url)!} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                            ) : (
                                <a href={project.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-full text-white/20 hover:text-white/40 transition-colors">
                                    <Play className="w-10 h-10" />
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Founders */}
            {project.founders && project.founders.length > 0 && (
                <section className="px-6 pb-16">
                    <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                        <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-6">Equipo Fundador</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {project.founders.map((founder, index) => (
                                <div key={index} className="glass-card rounded-xl p-5 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/6 flex items-center justify-center overflow-hidden mx-auto mb-3">
                                        {founder.photo_url ? <img src={founder.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-yellow-600/60">{founder.name.charAt(0)}</span>}
                                    </div>
                                    <h3 className="text-white text-sm font-bold">{founder.name}</h3>
                                    {founder.role && <p className="text-yellow-500/60 text-xs font-medium mt-0.5">{founder.role}</p>}
                                    {founder.country && <p className="text-white/20 text-[10px] flex items-center gap-0.5 justify-center mt-0.5"><MapPin className="w-2.5 h-2.5" />{founder.country}</p>}
                                    {(founder.linkedin_url || founder.instagram_url) && (
                                        <div className="flex items-center justify-center gap-2 mt-3">
                                            {founder.linkedin_url && <a href={founder.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/[0.03] border border-white/6 flex items-center justify-center text-white/25 hover:text-white/50 transition-all"><Linkedin className="w-3 h-3" /></a>}
                                            {founder.instagram_url && <a href={founder.instagram_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/[0.03] border border-white/6 flex items-center justify-center text-white/25 hover:text-white/50 transition-all"><Instagram className="w-3 h-3" /></a>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <footer className="border-t border-white/5 py-6 px-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between text-white/20 text-xs">
                    <p>© 2026 START Lima</p>
                    <Link href="/projects" className="flex items-center gap-1.5 hover:text-white/40 transition-colors"><ArrowLeft className="w-3 h-3" /> Galería</Link>
                </div>
            </footer>
        </div>
    )
}
