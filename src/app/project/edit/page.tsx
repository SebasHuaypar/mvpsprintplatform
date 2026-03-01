'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Project, Founder } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Save,
    Send,
    Plus,
    Trash2,
    Upload,
    Image as ImageIcon,
    User,
    Link as LinkIcon,
    Rocket,
    FileText,
    Users,
    Check,
    X,
    Loader2,
} from 'lucide-react'
import { GlassSelect } from '@/components/ui/GlassSelect'

type Tab = 'basic' | 'description' | 'product' | 'founders'

export default function ProjectEditPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<Tab>('basic')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const [projectId, setProjectId] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [shortDescription, setShortDescription] = useState('')
    const [longDescription, setLongDescription] = useState('')
    const [category, setCategory] = useState('')
    const [country, setCountry] = useState('')
    const [demoUrl, setDemoUrl] = useState('')
    const [videoUrl, setVideoUrl] = useState('')
    const [productStatus, setProductStatus] = useState('')
    const [logoUrl, setLogoUrl] = useState('')
    const [coverUrl, setCoverUrl] = useState('')
    const [status, setStatus] = useState('draft')
    const [founders, setFounders] = useState<Partial<Founder>[]>([])
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [uploadingCover, setUploadingCover] = useState(false)
    const [uploadingFounderPhoto, setUploadingFounderPhoto] = useState<number | null>(null)

    useEffect(() => {
        if (user) loadProject()
    }, [user])

    useEffect(() => {
        if (name && !projectId) {
            setSlug(
                name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            )
        }
    }, [name, projectId])

    async function loadProject() {
        const supabase = getSupabase()
        const { data: project } = await supabase.from('projects').select('*').eq('owner_id', user!.id).single()
        if (project) {
            setProjectId(project.id); setName(project.name || ''); setSlug(project.slug || '')
            setShortDescription(project.short_description || ''); setLongDescription(project.long_description || '')
            setCategory(project.category || ''); setCountry(project.country || '')
            setDemoUrl(project.demo_url || ''); setVideoUrl(project.video_url || '')
            setProductStatus(project.product_status || ''); setLogoUrl(project.logo_url || '')
            setCoverUrl(project.cover_image_url || ''); setStatus(project.status || 'draft')
            const { data: foundersData } = await supabase.from('founders').select('*').eq('project_id', project.id).order('created_at', { ascending: true })
            if (foundersData) setFounders(foundersData)
        }
        setLoading(false)
    }

    async function uploadFile(file: File, path: string): Promise<string | null> {
        const supabase = getSupabase()
        const filePath = `${path}/${Date.now()}.${file.name.split('.').pop()}`
        const { error } = await supabase.storage.from('project-assets').upload(filePath, file)
        if (error) return null
        const { data } = supabase.storage.from('project-assets').getPublicUrl(filePath)
        return data.publicUrl
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'founder', founderIndex?: number) {
        const file = e.target.files?.[0]
        if (!file) return
        if (type === 'logo') setUploadingLogo(true)
        else if (type === 'cover') setUploadingCover(true)
        else if (type === 'founder' && founderIndex !== undefined) setUploadingFounderPhoto(founderIndex)
        const url = await uploadFile(file, `${user!.id}/${type}`)
        if (url) {
            if (type === 'logo') setLogoUrl(url)
            else if (type === 'cover') setCoverUrl(url)
            else if (type === 'founder' && founderIndex !== undefined) {
                const updated = [...founders]; updated[founderIndex] = { ...updated[founderIndex], photo_url: url }; setFounders(updated)
            }
        }
        if (type === 'logo') setUploadingLogo(false)
        else if (type === 'cover') setUploadingCover(false)
        else if (type === 'founder') setUploadingFounderPhoto(null)
    }

    async function saveProject(submitForReview = false) {
        submitForReview ? setSubmitting(true) : setSaving(true)
        setMessage(null)
        try {
            const supabase = getSupabase()
            const projectData = {
                owner_id: user!.id, name, slug,
                short_description: shortDescription || null, long_description: longDescription || null,
                category: category || null, country: country || null,
                demo_url: demoUrl || null, video_url: videoUrl || null,
                product_status: productStatus || null, logo_url: logoUrl || null,
                cover_image_url: coverUrl || null,
                status: submitForReview ? 'under_review' : status === 'published' ? 'published' : 'draft',
                updated_at: new Date().toISOString(),
            }
            let savedProjectId = projectId
            if (projectId) {
                const { error } = await supabase.from('projects').update(projectData).eq('id', projectId)
                if (error) throw error
            } else {
                const { data, error } = await supabase.from('projects').insert(projectData).select('id').single()
                if (error) throw error
                savedProjectId = data.id; setProjectId(data.id)
            }
            if (savedProjectId) {
                await supabase.from('founders').delete().eq('project_id', savedProjectId)
                const validFounders = founders.filter(f => f.name).map(f => ({
                    project_id: savedProjectId!, name: f.name!, role: f.role || null,
                    photo_url: f.photo_url || null, linkedin_url: f.linkedin_url || null,
                    instagram_url: f.instagram_url || null, country: f.country || null,
                }))
                if (validFounders.length > 0) {
                    const { error } = await supabase.from('founders').insert(validFounders)
                    if (error) throw error
                }
                const { data: reloaded } = await supabase.from('founders').select('*').eq('project_id', savedProjectId).order('created_at', { ascending: true })
                if (reloaded) setFounders(reloaded)
            }
            if (submitForReview) setStatus('under_review')
            setMessage({ type: 'success', text: submitForReview ? 'Proyecto enviado para revisión.' : 'Guardado correctamente.' })
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Error al guardar.' })
        } finally { setSaving(false); setSubmitting(false) }
    }

    const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
        { key: 'basic', label: 'Básica', icon: FileText },
        { key: 'description', label: 'Descripción', icon: FileText },
        { key: 'product', label: 'Producto', icon: Rocket },
        { key: 'founders', label: 'Equipo', icon: Users },
    ]

    if (loading) {
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
            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8 animate-fade-in-up">
                    <p className="text-white/30 text-xs font-medium tracking-widest uppercase mb-2">
                        {projectId ? 'Editar' : 'Nuevo'} Proyecto
                    </p>
                    <h1 className="text-2xl font-bold text-white">
                        Información del <span className="text-yellow-500">Proyecto</span>
                    </h1>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-scale-in ${message.type === 'success' ? 'bg-yellow-600/10 text-yellow-500 border border-yellow-600/20' : 'bg-navy-600/30 text-white/60 border border-navy-500/30'
                        }`}>
                        {message.type === 'success' ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <X className="w-3.5 h-3.5 flex-shrink-0" />}
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2.5 mb-8 animate-fade-in-up overflow-x-auto custom-scrollbar pb-2" style={{ animationDelay: '0.1s' }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-shrink-0 py-2 px-5 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap border
                                ${activeTab === tab.key
                                    ? 'bg-yellow-500 border-yellow-500 text-navy-900 shadow-[0_0_15px_rgba(255,199,0,0.3)]'
                                    : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:bg-white/[0.06] hover:border-white/20'
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Form */}
                <div className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>

                    {activeTab === 'basic' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/40 text-xs font-medium mb-1.5">Nombre *</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-glass" placeholder="Mi Startup" />
                                </div>
                                <div>
                                    <label className="block text-white/40 text-xs font-medium mb-1.5">Slug</label>
                                    <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="input-glass" placeholder="mi-startup" disabled={!!projectId} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/40 text-xs font-medium mb-1.5">Categoría *</label>
                                    <GlassSelect
                                        value={category}
                                        onChange={setCategory}
                                        options={[
                                            { value: 'healthtech', label: 'Healthtech', icon: '🏥' },
                                            { value: 'agritech', label: 'Agritech', icon: '🌱' },
                                            { value: 'open_innovation', label: 'Open Innovation', icon: '💡' }
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/40 text-xs font-medium mb-1.5">País</label>
                                    <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="input-glass" placeholder="Perú" />
                                </div>
                            </div>

                            {/* Logo */}
                            <div>
                                <label className="block text-white/40 text-xs font-medium mb-1.5">Logo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/6 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-white/15" />}
                                    </div>
                                    <label className="cursor-pointer text-yellow-500/70 hover:text-yellow-500 text-xs font-medium transition-colors">
                                        {uploadingLogo ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Subiendo...</span> : '+ Subir imagen'}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                                    </label>
                                </div>
                            </div>

                            {/* Cover */}
                            <div>
                                <label className="block text-white/40 text-xs font-medium mb-1.5">Portada</label>
                                <div className="relative w-full h-36 rounded-xl bg-white/[0.03] border border-white/6 overflow-hidden group">
                                    {coverUrl ? (
                                        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-white/15">
                                            <ImageIcon className="w-8 h-8 mb-1" />
                                            <p className="text-xs">Arrastra o haz click</p>
                                        </div>
                                    )}
                                    <label className="absolute inset-0 flex items-center justify-center bg-navy-900/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        {uploadingCover ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Upload className="w-6 h-6 text-white/60" />}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
                                    </label>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'description' && (
                        <>
                            <div>
                                <label className="block text-white/40 text-xs font-medium mb-1.5">Descripción corta</label>
                                <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="input-glass" placeholder="Plataforma que conecta doctores con pacientes rurales" maxLength={200} />
                                <p className="text-white/20 text-[10px] mt-1">{shortDescription.length}/200</p>
                            </div>
                            <div>
                                <label className="block text-white/40 text-xs font-medium mb-1.5">Problema & Solución</label>
                                <textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} className="input-glass min-h-[180px] resize-y" placeholder="Describe el problema que resuelves y tu solución..." rows={7} />
                            </div>
                        </>
                    )}

                    {activeTab === 'product' && (
                        <>
                            <div>
                                <label className="block text-white/40 text-xs font-medium mb-1.5">Demo URL</label>
                                <input type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} className="input-glass" placeholder="https://demo.mi-startup.com" />
                            </div>
                            <div>
                                <label className="block text-white/40 text-xs font-medium mb-1.5">Video URL</label>
                                <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="input-glass" placeholder="https://youtube.com/watch?v=..." />
                            </div>
                            <div>
                                <label className="block text-white/40 text-xs font-medium mb-1.5">Estado del producto</label>
                                <GlassSelect
                                    value={productStatus}
                                    onChange={setProductStatus}
                                    options={[
                                        { value: 'prototype', label: 'Prototipo', icon: '🛠️' },
                                        { value: 'beta', label: 'Beta', icon: '🚀' },
                                        { value: 'live', label: 'Live', icon: '🌟' }
                                    ]}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'founders' && (
                        <>
                            <div className="flex items-center justify-between">
                                <p className="text-white/40 text-xs font-medium">Equipo fundador</p>
                                <button onClick={() => setFounders([...founders, { name: '', role: '', country: '' }])} className="text-yellow-500/70 hover:text-yellow-500 text-xs font-medium transition-colors flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Agregar
                                </button>
                            </div>

                            {founders.length === 0 ? (
                                <div className="text-center py-12">
                                    <User className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                    <p className="text-white/25 text-sm">Sin fundadores</p>
                                    <button onClick={() => setFounders([{ name: '', role: '', country: '' }])} className="mt-3 text-yellow-500/70 hover:text-yellow-500 text-xs font-medium">+ Agregar</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {founders.map((founder, index) => (
                                        <div key={index} className="glass-card rounded-xl p-4 relative">
                                            <button onClick={() => setFounders(founders.filter((_, i) => i !== index))} className="absolute top-3 right-3 text-white/15 hover:text-white/40 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>

                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/6 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {founder.photo_url ? <img src={founder.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-white/15" />}
                                                </div>
                                                <label className="cursor-pointer text-yellow-500/60 hover:text-yellow-500 text-[10px] font-medium transition-colors">
                                                    {uploadingFounderPhoto === index ? 'Subiendo...' : 'Foto'}
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'founder', index)} />
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <input type="text" value={founder.name || ''} onChange={(e) => { const u = [...founders]; u[index] = { ...u[index], name: e.target.value }; setFounders(u) }} className="input-glass text-xs" placeholder="Nombre *" />
                                                <input type="text" value={founder.role || ''} onChange={(e) => { const u = [...founders]; u[index] = { ...u[index], role: e.target.value }; setFounders(u) }} className="input-glass text-xs" placeholder="Rol" />
                                                <input type="text" value={founder.country || ''} onChange={(e) => { const u = [...founders]; u[index] = { ...u[index], country: e.target.value }; setFounders(u) }} className="input-glass text-xs" placeholder="País" />
                                                <input type="url" value={founder.linkedin_url || ''} onChange={(e) => { const u = [...founders]; u[index] = { ...u[index], linkedin_url: e.target.value }; setFounders(u) }} className="input-glass text-xs" placeholder="LinkedIn URL" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-white/5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <button onClick={() => saveProject(false)} disabled={saving || !name} className="flex items-center gap-2 px-5 py-2.5 text-white/50 text-sm font-medium rounded-full border border-white/8 hover:border-white/15 hover:text-white/70 transition-all disabled:opacity-30">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    {status !== 'published' && (
                        <button onClick={() => saveProject(true)} disabled={submitting || !name} className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 text-navy-900 text-sm font-bold rounded-full transition-all duration-200 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-600/20 disabled:opacity-30">
                            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {submitting ? 'Enviando...' : 'Enviar'}
                        </button>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
