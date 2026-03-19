"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Shield, Key, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: ''
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile')
                if (!res.ok) throw new Error('Yüklenemedi')
                const json = await res.json()
                setUser(json.data)
                setFormData(prev => ({ ...prev, name: json.data.name || '' }))
            } catch (error) {
                toast.error('Profil bilgileri yüklenemedi')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Girdiğiniz şifreler eşleşmiyor')
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    password: formData.password || undefined
                })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.message || 'Güncellenemedi')

            toast.success('Profil başarıyla güncellendi')
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))

            // Sidebar'daki ismi güncellemek için sayfayı yenilemek en garantisi
            // Veya bir state management kullanılabilir. Küçük ölçekte router.refresh() + timeout yeterli.
            setTimeout(() => {
                window.location.reload()
            }, 1000)

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-2">Profilim</h1>
                <p className="text-slate-500 font-medium">Hesap bilgilerinizi ve güvenliğinizi bu ekrandan yönetebilirsiniz.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Info Card */}
                <div className="space-y-6">
                    <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                        <CardContent className="relative pt-0 px-6 pb-6 text-center">
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-xl">
                                    <div className="w-full h-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                        <User className="w-10 h-10 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-16 space-y-1">
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{user?.name}</h3>
                                <p className="text-sm text-slate-500 font-medium">{user?.email}</p>
                                <div className="pt-4 flex justify-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user?.role === 'ADMIN' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                                        }`}>
                                        {user?.role === 'ADMIN' ? 'SİSTEM YÖNETİCİSİ' : 'STANDART KULLANICI'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50 space-y-4">
                        <div className="flex items-center space-x-3 text-blue-700">
                            <Shield className="w-5 h-5" />
                            <span className="font-bold text-sm tracking-tight text-blue-900">Güvenlik İpucu</span>
                        </div>
                        <p className="text-xs text-blue-700/80 leading-relaxed font-medium">
                            Hesabınızın güvenliği için en az 8 karakterli, harf ve rakam içeren güçlü bir şifre kullanmanızı öneririz.
                        </p>
                    </div>
                </div>

                {/* Right: Forms */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSave}>
                        <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold tracking-tight">Kişisel Bilgiler</CardTitle>
                                <CardDescription className="font-medium">Sistemde görünen isminizi buradan güncelleyin.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">İSİM SOYİSİM</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all font-medium"
                                            placeholder="İsminizi girin"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">E-POSTA ADRESİ</Label>
                                        <Input
                                            value={user?.email}
                                            disabled
                                            className="h-12 bg-slate-50 border-slate-100 text-slate-400 rounded-xl font-medium cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100"></div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 text-slate-900">
                                        <Key className="w-4 h-4 text-blue-600" />
                                        <span className="font-bold text-sm tracking-tight">Şifre Değiştir</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">YENİ ŞİFRE</Label>
                                            <Input
                                                type="password"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">ŞİFRE TEKRAR</Label>
                                            <Input
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium ml-1 flex items-center gap-1.5">
                                        <AlertCircle className="w-3 h-3" />
                                        Şifrenizi değiştirmek istemiyorsanız bu alanları boş bırakın.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 flex justify-end px-6 py-4 rounded-b-2xl border-t border-slate-100">
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 group"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 transition-transform group-hover:scale-110" />
                                            <span>Değişiklikleri Kaydet</span>
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </div>
            </div>
        </div>
    )
}
