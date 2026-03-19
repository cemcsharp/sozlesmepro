"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FileText,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  BarChart3,
  ChevronRight,
  Clock,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message || 'Lütfen bilgilerinizi kontrol edin')
        return
      }
      toast.success('Giriş başarılı, yönlendiriliyorsunuz...')
      window.location.href = '/'
    } catch (error) {
      toast.error('Giriş sırasında bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: FileText,
      title: "Dijital Arşiv",
      desc: "Tüm sözleşmelerinizi tek bir merkezden güvenle yönetin ve arşivleyin."
    },
    {
      icon: Clock,
      title: "Vade Hatırlatıcıları",
      desc: "Sözleşme bitiş tarihlerini kaçırmayın, sistem sizi zamanında uyarsın."
    },
    {
      icon: Users,
      title: "Şirket Yönetimi",
      desc: "Birden fazla şirketi ve departmanı aynı sistem üzerinden koordine edin."
    },
    {
      icon: BarChart3,
      title: "Maliyet Analizi",
      desc: "Sözleşme kalemlerini ve operasyonel maliyetleri kolayca raporlayın."
    }
  ]

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white overflow-hidden selection:bg-blue-100 selection:text-blue-900 font-outfit">

      {/* Left Side: Information & Branding */}
      <div className="hidden lg:flex flex-col relative overflow-hidden bg-[#111827]">
        {/* Abstract Background Decor */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-16 justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter">Sözleşme<span className="text-blue-400">PRO</span></h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Kurumsal Takip Sistemi</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-xl space-y-12">
            <div className="space-y-6">
              <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
                Sözleşme Süreçlerinizi <br />
                <span className="text-blue-400">
                  Kontrol Altına Alın.
                </span>
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                Karmaşıklığı ortadan kaldırın. Sözleşme takibi, vade yönetimi ve raporlama süreçlerini tek bir platformda birleştirin.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{feature.title}</h4>
                    <p className="text-xs text-white/40 leading-relaxed font-medium">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
              <span>GÜVENLİ VE DİJİTAL SÖZLEŞME YÖNETİMİ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form - High Contrast Background */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-12 relative bg-[#edf2f7] border-l border-slate-200 mesh-gradient">
        {/* Subtle Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-blue-200/40 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-indigo-100/40 rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-[500px] relative z-20 animate-in fade-in slide-in-from-right-8 duration-700">
          {/* Card Container - Solid & Deep Shadow */}
          <div className="bg-white rounded-[32px] p-8 lg:p-14 shadow-2xl border border-white relative overflow-hidden">
            {/* Branding Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 premium-gradient-blue" />

            {/* Heading */}
            <div className="space-y-4 mb-10">
              <h3 className="text-4xl font-bold text-slate-900 tracking-tight leading-none">Sözleşme<span className="text-blue-600">PRO</span></h3>
              <p className="text-slate-500 font-medium text-base">Yönetim paneline erişmek için giriş yapın.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3 group">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 group-focus-within:text-blue-600 transition-colors">E-POSTA ADRESİ</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-posta adresiniz"
                    className="h-12 bg-white border-slate-200 rounded-lg px-4 text-sm font-medium text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all placeholder:text-slate-400 shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 group-focus-within:text-blue-600 transition-colors">ŞİFRE</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifreniz"
                      className="h-12 bg-white border-slate-200 rounded-lg px-4 text-sm font-medium text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 pr-12 transition-all placeholder:text-slate-400 shadow-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-1">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(Boolean(v))}
                  className="w-5 h-5 rounded-lg border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="remember" className="text-sm font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">Oturumu Açık Tut</Label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 premium-gradient-blue hover:opacity-90 text-white font-bold text-sm rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 group overflow-hidden relative border-none"
                disabled={loading}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Doğrulanıyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Sisteme Giriş Yap</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
                <div className="absolute top-0 left-[-100%] group-hover:left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-all duration-1000 ease-in-out" />
              </Button>
            </form>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="absolute bottom-8 text-center opacity-40">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            © SözleşmePRO • Kurumsal Çözümler • 2024
          </p>
        </div>
      </div>
    </div>
  )
}