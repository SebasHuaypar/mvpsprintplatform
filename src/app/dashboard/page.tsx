'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Project } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    FileText,
    ArrowRight,
    Rocket,
    Clock,
    Eye,
    Plus,
} from 'lucide-react'

export default function DashboardPage() {
    const { user, profile } = useAuth()
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchProject()
    }, [user])

    async function fetchProject() {
        const supabase = getSupabase()
        const { data } = await supabase
            .from('projects')
            .select('*')
            .eq('owner_id', user!.id)
            .single()

        setProject(data as Project | null)
        setLoading(false)
    }

    const statusConfig: Record<string, { label: string; icon: typeof FileText; className: string; description: string }> = {
        draft: {
            label: 'Borrador',
            icon: FileText,
            className: 'status-draft',
            description: 'Tu proyecto aún no ha sido enviado para revisión.',
        },
        under_review: {
            label: 'En Revisión',
            icon: Clock,
            className: 'status-review',
            description: 'Tu proyecto está siendo revisado por el equipo de START.',
        },
        published: {
            label: 'Publicado',
            icon: Rocket,
            className: 'status-published',
            description: '¡Tu proyecto está visible en la galería pública!',
        },
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Greeting */}
                <div className="mb-10 animate-fade-in-up">
                    <p className="text-white/30 text-xs font-medium tracking-widest uppercase mb-2">
                        MVP Sprint Platform
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                        Hola, <span className="text-yellow-500">{profile?.full_name || profile?.email?.split('@')[0] || 'Participante'}</span>
                    </h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" />
                    </div>
                ) : project ? (
                    <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {/* Project Card */}
                        <div className="glass-card rounded-2xl p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                                {/* Logo */}
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {project.logo_url ? (
                                        <img src={project.logo_url} alt={project.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Rocket className="w-6 h-6 text-yellow-600" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-bold text-white truncate">{project.name}</h2>
                                    <p className="text-white/30 text-sm truncate mt-0.5">
                                        {project.short_description || '/projects/' + project.slug}
                                    </p>
                                </div>

                                {/* Status */}
                                <div className={`${statusConfig[project.status].className} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 self-start`}>
                                    {(() => {
                                        const StatusIcon = statusConfig[project.status].icon
                                        return <StatusIcon className="w-3 h-3" />
                                    })()}
                                    {statusConfig[project.status].label}
                                </div>
                            </div>

                            <p className="text-white/30 text-xs mb-6">
                                {statusConfig[project.status].description}
                            </p>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/project/edit"
                                    className="group inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-600 text-navy-900 text-sm font-bold rounded-full transition-all duration-200 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-600/20"
                                >
                                    Editar Proyecto
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>

                                {project.status === 'published' && (
                                    <Link
                                        href={`/projects/${project.slug}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 text-white/50 text-sm font-medium rounded-full border border-white/8 hover:border-white/15 hover:text-white/70 transition-all"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Ver Página
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Categoría', value: project.category?.replace('_', ' ') || '—' },
                                { label: 'País', value: project.country || '—' },
                                { label: 'Demo', value: project.demo_url ? 'Activo' : '—' },
                            ].map((stat) => (
                                <div key={stat.label} className="glass-card rounded-xl p-4">
                                    <p className="text-white/25 text-[10px] font-medium tracking-wider uppercase">{stat.label}</p>
                                    <p className="text-white text-sm font-bold mt-1 capitalize truncate">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* No Project */
                    <div className="text-center py-16 animate-fade-in-up">
                        <div className="w-16 h-16 rounded-2xl bg-yellow-600/8 flex items-center justify-center mx-auto mb-6">
                            <Plus className="w-7 h-7 text-yellow-600" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Crea tu proyecto</h2>
                        <p className="text-white/30 text-sm mb-8 max-w-sm mx-auto">
                            Registra tu proyecto del MVP Sprint y muéstralo al mundo.
                        </p>
                        <Link
                            href="/project/edit"
                            className="group inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 text-navy-900 font-bold text-sm rounded-full transition-all duration-200 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-600/20"
                        >
                            Crear Proyecto
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
