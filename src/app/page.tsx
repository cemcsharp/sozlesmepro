"use client"

import { useState, useEffect, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  CalendarDays,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  Edit,
  Grid,
  List,
  Plus,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  Users,
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useCompany } from '@/context/CompanyContext'
// ... rest of imports
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

interface Contract {
  id: string
  contractNumber: string
  subject: string
  startDate: string
  endDate: string
  department: string
  amount: number
  currency: string
  daysUntilExpiry: number
}

interface DashboardStats {
  totalContracts: number
  expiringIn30Days: number
  expiringIn15Days: number
  expiringIn7Days: number
  expiringIn1Day: number
  activeContracts: number
  expiredContracts: number
}

const COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#f43f5e']

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedCompany, isLoading: isCompanyLoading } = useCompany()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    expiringIn30Days: 0,
    expiringIn15Days: 0,
    expiringIn7Days: 0,
    expiringIn1Day: 0,
    activeContracts: 0,
    expiredContracts: 0
  })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card')

  useEffect(() => {
    const load = async () => {
      if (!selectedCompany) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const res = await fetch(`/api/dashboard?companyId=${selectedCompany.id}`)
        if (!res.ok) throw new Error('Dashboard verisi alınamadı')
        const json = await res.json()
        if (!json.success || !json.data) {
          throw new Error(json.message || 'Veri formatı hatalı')
        }
        const d = json.data
        if (!d.stats) throw new Error('İstatistik verisi bulunamadı')
        setStats(d.stats)
        const mapped: Contract[] = d.contracts.map((c: any) => ({
          id: c.id,
          contractNumber: c.contractNumber,
          subject: c.subject,
          startDate: c.startDate,
          endDate: c.endDate,
          department: c.department?.name || '',
          amount: c.amount,
          currency: c.currency || 'TRY',
          daysUntilExpiry: c.daysUntilExpiry
        }))
        setContracts(mapped)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCompany])

  const chartData = useMemo(() => [
    { name: 'Kritik (24s)', value: stats.expiringIn1Day, color: '#f43f5e' },
    { name: 'Yaklaşan (7g)', value: stats.expiringIn7Days, color: '#8b5cf6' },
    { name: 'Takip (30g)', value: stats.expiringIn30Days, color: '#6366f1' },
    { name: 'Aktif', value: stats.activeContracts, color: '#10b981' },
  ], [stats])

  const deptData = useMemo(() => {
    const depts: Record<string, number> = {}
    contracts.forEach(c => {
      depts[c.department] = (depts[c.department] || 0) + 1
    })
    return Object.entries(depts).map(([name, value]) => ({ name, value }))
  }, [contracts])

  const getExpiryColor = (days: number) => {
    if (days <= 1) return 'bg-rose-500'
    if (days <= 7) return 'bg-orange-500'
    if (days <= 15) return 'bg-amber-400'
    if (days <= 30) return 'bg-blue-500'
    return 'bg-emerald-500'
  }

  const getExpiryBadgeClass = (days: number) => {
    if (days <= 1) return 'bg-rose-50 text-rose-700 border-rose-100 font-bold'
    if (days <= 7) return 'bg-orange-50 text-orange-700 border-orange-100 font-bold'
    if (days <= 15) return 'bg-amber-50 text-amber-700 border-amber-100'
    return 'bg-blue-50 text-blue-700 border-blue-100'
  }

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency || 'TRY',
        maximumFractionDigits: 0
      }).format(amount)
    } catch (e) {
      return `${amount} ${currency || 'TRY'}`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const handleViewContract = (contractId: string) => {
    router.push(`/contracts/view/${contractId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="relative flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-blue-600"></div>
          <p className="mt-4 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 mesh-gradient">
      {/* Subtle Header Area */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-white border-b border-slate-200 pointer-events-none" />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 space-y-10">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {selectedCompany?.name || 'Kontrol Paneli'}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Bugün için <span className="text-rose-600 font-semibold">{stats.expiringIn7Days} kritik</span> sözleşme aksiyon bekliyor.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/contracts/create">
              <Button className="premium-gradient-blue hover:opacity-90 text-white font-bold text-sm rounded-md h-11 px-8 shadow-lg shadow-blue-500/20 transition-all border-none">
                <Plus className="mr-2 h-5 w-5" /> Yeni Sözleşme
              </Button>
            </Link>
          </div>
        </div>

        {/* Precise Stat Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          {[
            { label: '24 Saat İçinde', val: stats.expiringIn1Day, trend: 'KRİTİK', color: 'text-rose-500', icon: AlertTriangle, trendColor: 'bg-rose-50 text-rose-600', cardBg: 'bg-rose-50/20 border-rose-100/40', glow: 'soft-glow-rose' },
            { label: 'Yaklaşan (7 Gün)', val: stats.expiringIn7Days, trend: 'TAKİP', color: 'text-violet-500', icon: Clock, trendColor: 'bg-violet-50 text-violet-600', cardBg: 'bg-violet-50/20 border-violet-100/40', glow: 'soft-glow-indigo' },
            { label: 'Son 1 Ay (30 Gün)', val: stats.expiringIn30Days, trend: 'BİLGİ', color: 'text-indigo-500', icon: CalendarDays, trendColor: 'bg-indigo-50 text-indigo-600', cardBg: 'bg-indigo-50/20 border-indigo-100/40', glow: 'soft-glow-blue' },
            { label: 'Aktif Sözleşme', val: stats.activeContracts, trend: 'GÜNCEL', color: 'text-emerald-500', icon: CheckCircle, trendColor: 'bg-emerald-50 text-emerald-600', cardBg: 'bg-emerald-50/20 border-emerald-100/40', glow: 'soft-glow-emerald' },
            { label: 'Toplam Arşiv', val: stats.totalContracts, trend: 'ARŞİV', color: 'text-slate-600', icon: FileText, trendColor: 'bg-slate-50 text-slate-500', cardBg: 'bg-slate-50/20 border-slate-100', glow: '' },
          ].map((item, i) => (
            <div key={i} className={cn("bg-white border border-slate-200 rounded-lg p-6 flex flex-col group transition-all card-hover-effect shadow-sm relative overflow-hidden")}>
                <div className={cn("absolute top-0 left-0 right-0 h-1", 
                  item.color === 'text-rose-500' ? 'premium-gradient-rose' : 
                  item.color === 'text-violet-500' ? 'premium-gradient-indigo' : 
                  item.color === 'text-indigo-500' ? 'premium-gradient-blue' : 
                  item.color === 'text-emerald-500' ? 'premium-gradient-emerald' : 'bg-slate-200')} />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <div className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", item.trendColor)}>{item.trend}</div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-3xl font-black tabular-nums tracking-tighter", item.color)}>{item.val}</span>
                <div className={cn("ml-auto w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:rotate-12", item.trendColor.split(' ')[0], item.glow)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Precise Charts */}
        <div className="grid gap-8 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Kritiklik Dağılımı</h3>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">SÜRE BAZLI RİSK ANALİZİ</p>
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider">GÜNCEL</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 4, 4]}
                    barSize={32}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-8 flex flex-col shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Birim Dağılımı</h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">SÖZLEŞME YOĞUNLUĞU</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">{contracts.length}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TOPLAM</span>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 w-full">
                {deptData.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[11px] font-bold text-slate-600 truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Precise Action Cards */}
        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          {[
            { title: 'Sözleşme Girişi', desc: 'Yeni bir kayıt oluşturun.', icon: Plus, link: '/contracts/create', color: 'text-blue-600', bg: 'bg-blue-50' },
            { title: 'Kayıt Arşivi', desc: 'Tüm sözleşmeleri yönetin.', icon: FileText, link: '/contracts', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { title: 'Sistem Ayarları', desc: 'Birim ve yetki düzenleme.', icon: Users, link: '/settings', color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((action, i) => (
            <Link key={i} href={action.link}>
              <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center gap-5 group hover:border-blue-200 transition-all shadow-sm">
                <div className={cn("w-12 h-12 rounded-md flex items-center justify-center transition-colors", action.bg, action.color)}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{action.title}</h4>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-blue-600 transition-all font-bold" />
              </div>
            </Link>
          ))}
        </div>

        {/* Critical Records Section */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-400">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Kritik Kayıtlar</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">YAKINDA SÜRESİ DOLACAK SÖZLEŞMELER</p>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-lg border border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('card')}
                className={cn("h-8 px-4 text-[10px] font-bold tracking-wider uppercase rounded-md transition-all", viewMode === 'card' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
              >
                KARTLAR
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn("h-8 px-4 text-[10px] font-bold tracking-wider uppercase rounded-md transition-all", viewMode === 'grid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
              >
                LİSTE
              </Button>
            </div>
          </div>

          {viewMode === 'card' ? (
            <div className="grid gap-6 md:grid-cols-2">
              {contracts.slice(0, 6).map((contract) => (
                <div
                  key={contract.id}
                  className="bg-white border border-slate-200 rounded-lg group p-6 flex flex-col justify-between hover:border-blue-200 transition-all cursor-pointer shadow-sm"
                  onClick={() => handleViewContract(contract.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{contract.subject}</h4>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">REF: {contract.contractNumber}</p>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      contract.daysUntilExpiry <= 7 ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {contract.daysUntilExpiry} GÜN
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">{contract.department}</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(contract.amount, contract.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-b border-slate-100 h-12">
                      <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-6">Sözleşme</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Birim</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Bitiş</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Tutar</TableHead>
                      <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right pr-6">Kalan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((cnt) => (
                      <TableRow key={cnt.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer border-b border-slate-100" onClick={() => handleViewContract(cnt.id)}>
                        <TableCell className="pl-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{cnt.subject}</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight uppercase">{cnt.contractNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[12px] font-semibold text-slate-600">{cnt.department}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-[12px] font-medium text-slate-600">{formatDate(cnt.endDate)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-[13px] font-bold text-slate-900 font-mono italic">{formatCurrency(cnt.amount, cnt.currency)}</span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex",
                            cnt.daysUntilExpiry <= 7 ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {cnt.daysUntilExpiry} Gün
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

    </div >
  )
}
