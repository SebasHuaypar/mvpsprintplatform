'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Project } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Shield,
    Search,
    UserPlus,
    ExternalLink,
    FileText,
    Clock,
    Rocket,
    Star,
    Loader2,
    Check,
    X,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'
import { GlassSelect } from '@/components/ui/GlassSelect'

export default function AdminPage() {
    const { isAdmin, loading: authLoading } = useAuth()
    const router = useRouter()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const [showCreateUser, setShowCreateUser] = useState(false)
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserPassword, setNewUserPassword] = useState('')
    const [newUserName, setNewUserName] = useState('')
    const [newUserRole, setNewUserRole] = useState<'participant' | 'admin'>('participant')
    const [creatingUser, setCreatingUser] = useState(false)
    const [createUserMessage, setCreateUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        if (!authLoading && !isAdmin) router.push('/dashboard')
    }, [isAdmin, authLoading, router])

    useEffect(() => {
        if (isAdmin) fetchProjects()
    }, [isAdmin])

    async function fetchProjects() {
        const supabase = getSupabase()
        const { data } = await supabase.from('projects').select('*').order('updated_at', { ascending: false })
        if (data) setProjects(data as Project[])
        setLoading(false)
    }

    async function updateProjectStatus(projectId: string, newStatus: string) {
        const supabase = getSupabase()
        setActionLoading(projectId)
        await supabase.from('projects').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', projectId)
        await fetchProjects()
        setActionLoading(null)
    }

    async function toggleFeatured(projectId: string, currentFeatured: boolean) {
        const supabase = getSupabase()
        setActionLoading(projectId)
        await supabase.from('projects').update({ featured: !currentFeatured }).eq('id', projectId)
        await fetchProjects()
        setActionLoading(null)
    }

    async function handleCreateUser(e: React.FormEvent) {
        e.preventDefault()
        setCreatingUser(true); setCreateUserMessage(null)
        try {
            const res = await fetch('/api/admin/create-user', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newUserEmail, password: newUserPassword, full_name: newUserName, role: newUserRole }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error')
            setCreateUserMessage({ type: 'success', text: `Usuario ${newUserEmail} creado como ${newUserRole}.` })
            setNewUserEmail(''); setNewUserPassword(''); setNewUserName(''); setNewUserRole('participant')
        } catch (err: any) { setCreateUserMessage({ type: 'error', text: err.message }) }
        finally { setCreatingUser(false) }
    }

    const filteredProjects = projects.filter((p) => {
        if (statusFilter && p.status !== statusFilter) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
        }
        return true
    })

    const statusConfig: Record<string, { label: string; icon: typeof FileText; className: string }> = {
        draft: { label: 'Borrador', icon: FileText, className: 'status-draft' },
        under_review: { label: 'En Revisión', icon: Clock, className: 'status-review' },
        published: { label: 'Publicado', icon: Rocket, className: 'status-published' },
    }

    const counts = {
        total: projects.length,
        draft: projects.filter(p => p.status === 'draft').length,
        under_review: projects.filter(p => p.status === 'under_review').length,
        published: projects.filter(p => p.status === 'published').length,
    }

    if (authLoading || !isAdmin) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-8 h-8 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
                    <div>
                        <p className="text-white/30 text-xs font-medium tracking-widest uppercase mb-2">Administración</p>
                        <h1 className="text-2xl font-bold text-white">Panel de <span className="text-yellow-500">Control</span></h1>
                    </div>
                    <button onClick={() => setShowCreateUser(!showCreateUser)} className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 text-navy-900 text-sm font-bold rounded-full transition-all duration-200 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-600/20 self-start">
                        <UserPlus className="w-3.5 h-3.5" />
                        Crear Usuario
                    </button>
                </div>

                {/* Create User */}
                {showCreateUser && (
                    <div className="mb-8 glass-card rounded-2xl p-6 animate-scale-in">
                        {createUserMessage && (
                            <div className={`mb-4 px-3 py-2 rounded-lg text-xs font-medium ${createUserMessage.type === 'success' ? 'bg-yellow-600/10 text-yellow-500' : 'bg-navy-600/30 text-white/60'}`}>
                                {createUserMessage.text}
                            </div>
                        )}
                        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="input-glass text-xs" placeholder="Nombre completo" required />
                            <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="input-glass text-xs" placeholder="Email" required />
                            <input type="text" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="input-glass text-xs" placeholder="Contraseña temporal" required minLength={6} />
                            <GlassSelect
                                value={newUserRole}
                                onChange={(val) => setNewUserRole(val as 'participant' | 'admin')}
                                options={[
                                    { value: 'participant', label: 'Participante', icon: '👤' },
                                    { value: 'admin', label: 'Admin', icon: '🛡️' }
                                ]}
                            />
                            <div className="sm:col-span-2 flex gap-2">
                                <button type="submit" disabled={creatingUser} className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 text-navy-900 text-xs font-bold rounded-full hover:bg-yellow-500 disabled:opacity-50 transition-all">
                                    {creatingUser ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                                    {creatingUser ? 'Creando...' : 'Crear'}
                                </button>
                                <button type="button" onClick={() => setShowCreateUser(false)} className="px-4 py-2 text-white/30 text-xs font-medium rounded-full hover:text-white/50 transition-colors">Cancelar</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {[
                        { label: 'Total', count: counts.total, filter: '' },
                        { label: 'Borrador', count: counts.draft, filter: 'draft' },
                        { label: 'Revisión', count: counts.under_review, filter: 'under_review' },
                        { label: 'Publicados', count: counts.published, filter: 'published' },
                    ].map((s) => (
                        <button key={s.label} onClick={() => setStatusFilter(s.filter)} className={`glass-card rounded-xl p-3 text-center transition-all ${statusFilter === s.filter ? 'border-yellow-600/30' : ''}`}>
                            <p className="text-lg font-black text-white">{s.count}</p>
                            <p className="text-white/25 text-[10px] font-medium mt-0.5">{s.label}</p>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-glass !pl-10 text-xs" placeholder="Buscar proyecto..." />
                </div>

                {/* Projects */}
                <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin" />
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-white/25 text-sm">Sin proyectos</p>
                        </div>
                    ) : (
                        filteredProjects.map((project) => (
                            <div key={project.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                {/* Info */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/6 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {project.logo_url ? <img src={project.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-yellow-600 text-xs font-bold">{project.name.charAt(0)}</span>}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-white text-sm font-bold truncate">{project.name}</h3>
                                        <p className="text-white/20 text-[10px] truncate">{project.short_description || project.slug}</p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className={`${statusConfig[project.status].className} px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 self-start sm:self-center`}>
                                    {(() => { const I = statusConfig[project.status].icon; return <I className="w-2.5 h-2.5" /> })()}
                                    {statusConfig[project.status].label}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {project.status === 'published' && (
                                        <a href={`/projects/${project.slug}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 text-white/30 text-[10px] font-medium rounded-lg border border-white/5 hover:border-white/10 hover:text-white/50 transition-all flex items-center gap-1">
                                            <ExternalLink className="w-2.5 h-2.5" /> Ver
                                        </a>
                                    )}
                                    {project.status !== 'published' && (
                                        <button onClick={() => updateProjectStatus(project.id, 'published')} disabled={actionLoading === project.id} className="px-2.5 py-1 bg-yellow-600/10 text-yellow-500 text-[10px] font-bold rounded-lg border border-yellow-600/20 hover:bg-yellow-600/20 transition-all disabled:opacity-50 flex items-center gap-1">
                                            {actionLoading === project.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />} Publicar
                                        </button>
                                    )}
                                    {project.status !== 'draft' && (
                                        <button onClick={() => updateProjectStatus(project.id, 'draft')} disabled={actionLoading === project.id} className="px-2.5 py-1 text-white/30 text-[10px] font-medium rounded-lg border border-white/5 hover:border-white/10 hover:text-white/50 transition-all disabled:opacity-50 flex items-center gap-1">
                                            <X className="w-2.5 h-2.5" /> {project.status === 'published' ? 'Quitar' : 'Rechazar'}
                                        </button>
                                    )}
                                    <button onClick={() => toggleFeatured(project.id, project.featured)} disabled={actionLoading === project.id} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all disabled:opacity-50 flex items-center gap-1 ${project.featured ? 'bg-yellow-600/10 text-yellow-500 border-yellow-600/20' : 'text-white/20 border-white/5 hover:text-white/40'}`}>
                                        <Star className="w-2.5 h-2.5" fill={project.featured ? 'currentColor' : 'none'} /> {project.featured ? '★' : '☆'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
