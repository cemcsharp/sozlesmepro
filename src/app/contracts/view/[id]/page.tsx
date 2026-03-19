"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Building,
  Mail,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  FileText as FileDoc,
  Printer,
  Users,
  Building2,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { generateContractPDF } from '@/lib/pdfGenerator'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ContractPrintTemplate } from '@/components/contracts/ContractPrintTemplate'

interface Contract {
  id: string
  contractNumber: string
  subject: string
  description: string
  startDate: string
  endDate: string
  amount: number
  currency: string | { code: string; name: string }
  paymentFrequency: string | { name: string }
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED'
  department: string
  departmentEmail: string
  company: {
    name: string
    prefix: string
    address?: string
    phone?: string
    email?: string
  }
  category?: { name: string }
  type?: { name: string }
  companyRepresentative?: string
  contactInfo?: string
  internalResponsible?: string
  counterpartyName?: string
  counterpartyContact?: string
  counterpartyEmail?: string
  counterpartyPhone?: string
  daysUntilExpiry: number
  createdAt: string
  updatedAt: string
  documents: Array<{
    id: string
    filename: string
    originalName: string
    fileSize: number
    mimeType: string
    createdAt: string
  }>
  notifications: Array<{
    id: string
    type: string
    daysBefore: number
    subject: string
    message: string
    isSent: boolean
    sentAt?: string
    createdAt: string
  }>
}

export default function ViewContractPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const search = useSearchParams()
  const contractId = params.id as string
  const isPublic = search.get('public') === '1'

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/contracts/${contractId}`)
        if (!res.ok) throw new Error('Sözleşme verisi alınamadı')
        const json = await res.json()
        const c = json.data
        const daysUntilExpiry = c.daysUntilExpiry
        const formatted: Contract = {
          id: c.id,
          contractNumber: c.contractNumber,
          subject: c.subject,
          description: c.description || '',
          startDate: new Date(c.startDate).toISOString(),
          endDate: new Date(c.endDate).toISOString(),
          amount: c.amount,
          currency: c.currency || 'TRY',
          paymentFrequency: c.paymentFrequency || 'ONE_TIME',
          status: c.status,
          department: c.department?.name || '',
          departmentEmail: c.department?.email || '',
          company: c.company || { name: 'Bilinmeyen Şirket', prefix: '---' },
          category: c.category,
          type: c.type,
          companyRepresentative: c.companyRepresentative,
          contactInfo: c.contactInfo,
          internalResponsible: c.internalResponsible,
          counterpartyName: c.counterpartyName,
          counterpartyContact: c.counterpartyContact,
          counterpartyEmail: c.counterpartyEmail,
          counterpartyPhone: c.counterpartyPhone,
          daysUntilExpiry: daysUntilExpiry,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          documents: (c.documents || []).map((d: any) => ({
            id: d.id,
            filename: d.filename,
            originalName: d.originalName,
            fileSize: d.fileSize,
            mimeType: d.mimeType,
            createdAt: d.createdAt
          })),
          notifications: (c.notifications || []).map((n: any) => ({
            id: n.id,
            type: n.type,
            daysBefore: n.daysBefore,
            subject: n.subject,
            message: n.message,
            isSent: n.isSent,
            sentAt: n.sentAt,
            createdAt: n.createdAt
          }))
        }
        setContract(formatted)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
    if (isPublic) {
      try {
        document.cookie = `public_view=1; path=/; max-age=${3 * 24 * 60 * 60}`
        document.cookie = `public_contract_id=${contractId}; path=/; max-age=${3 * 24 * 60 * 60}`
      } catch { }
    }
  }, [contractId, isPublic])

  const handleDownload = (filename: string, originalName: string) => {
    const link = document.createElement('a')
    link.href = `/api/download?filename=${filename}`
    link.download = originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDeleteContract = async () => {
    if (!contract || !confirm(`"${contract.subject}" başlıklı sözleşmeyi silmek istediğinize emin misiniz?`)) return

    try {
      const res = await fetch(`/api/contracts/${contract.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Sözleşme silinemedi')
      toast({ title: 'Başarılı', description: 'Sözleşme kaydı sistemden kalıcı olarak silindi.' })
      router.push('/contracts')
    } catch (e) {
      toast({ title: 'Hata', description: 'Silme işlemi sırasında bir sorun oluştu', variant: 'destructive' })
    }
  }

  const handleGeneratePDF = async () => {
    if (!contract) return
    try {
      await generateContractPDF('contract-pdf-template', contract.subject)
      toast({ title: 'Başarılı', description: 'PDF başarıyla oluşturuldu' })
    } catch (e: any) {
      console.error(e)
      toast({ title: 'Hata', description: e.message || 'PDF oluşturulurken bir sorun oluştu', variant: 'destructive' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'EXPIRED': return 'bg-red-500'
      case 'TERMINATED': return 'bg-gray-500'
      case 'RENEWED': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'EXPIRED': return 'destructive'
      case 'TERMINATED': return 'secondary'
      case 'RENEWED': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Aktif'
      case 'EXPIRED': return 'Süresi Dolmuş'
      case 'TERMINATED': return 'Feshedilmiş'
      case 'RENEWED': return 'Yenilenmiş'
      default: return status
    }
  }

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'EXPIRATION_WARNING': return 'Sona Erme Uyarısı'
      case 'EXPIRED': return 'Süresi Doldu'
      case 'RENEWAL_REMINDER': return 'Yenileme Hatırlatma'
      default: return type
    }
  }

  const getPaymentFrequencyLabel = (freq: any) => {
    if (!freq) return '---'
    const val = typeof freq === 'string' ? freq : freq.name || freq.code
    switch (val) {
      case 'ONE_TIME': return 'Tek Seferlik'
      case 'ANNUAL': return 'Yıllık'
      case 'QUARTERLY': return 'Üç Aylık'
      case 'MONTHLY': return 'Aylık'
      default: return val
    }
  }

  const getCurrencyLabel = (curr: any) => {
    if (!curr) return 'TRY'
    return typeof curr === 'string' ? curr : curr.code || 'TRY'
  }

  const formatCurrency = (amount: number, currency: any) => {
    const code = getCurrencyLabel(currency)
    try {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: code || 'TRY'
      }).format(amount)
    } catch (e) {
      return `${amount} ${code || 'TRY'}`
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-6 w-6" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-6 w-6" />
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileDoc className="h-6 w-6" />
    return <File className="h-6 w-6" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/30">
        <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-blue-100 border-t-blue-600"></div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/30">
        <div className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <FileText className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sözleşme Bulunamadı</h2>
          <p className="text-sm font-medium text-slate-500">Aradığınız sözleşme veritabanında mevcut değil veya görüntüleme yetkiniz yok.</p>
          <Link href="/contracts" className="block">
            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-all">Sözleşmelere Dön</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-blue-100/10 to-transparent pointer-events-none" />

      <div id="contract-print-area" className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 space-y-8">
        {/* Concise Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-1.5">
            <Link href="/contracts" className="group flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-blue-600 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Liste Arşivine Dön
            </Link>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">Sözleşme Analizi</h1>
            <p className="text-[13px] font-medium text-slate-500">Ref No: <span className="text-blue-600 font-bold">{contract.contractNumber}</span></p>
          </div>
          <div className="flex items-center gap-3">
            {!isPublic && (
              <>
                <Button onClick={handleDeleteContract} variant="ghost" className="h-11 px-6 rounded-xl text-rose-600 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 transition-all">
                  <Trash2 className="mr-2 h-4 w-4" /> KAYDI SİL
                </Button>
                <Link href={`/contracts/edit/${contract.id}`}>
                  <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                    <Edit className="mr-2 h-4 w-4" /> DÜZENLE
                  </Button>
                </Link>
              </>
            )}
            <Button onClick={handleGeneratePDF} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-widest rounded-xl h-11 px-8 uppercase shadow-md transition-all">
              <Printer className="mr-2 h-4 w-4" /> PDF YAZDIR
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-6 duration-700 delay-100">
            {/* Primary Details Card */}
            <div className="stripe-card p-8 space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Badge variant={getStatusBadgeVariant(contract.status)} className="h-7 px-3 rounded-full flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest border-none shadow-sm capitalize">
                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(contract.status)} shadow-sm`} />
                  {getStatusLabel(contract.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{contract.subject}</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{contract.company?.name || '---'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sözleşme Özeti</p>
                    <p className="text-[13px] font-medium leading-relaxed text-slate-600 italic">
                      {contract.description || 'Bu sözleşme için herhangi bir açıklama girilmemiş.'}
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
                      <div>
                        <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">PROJE BEDELİ</p>
                        <p className="text-2xl font-black text-emerald-900 font-mono tracking-tighter">{formatCurrency(contract.amount, contract.currency)}</p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</p>
                    <p className="text-[13px] font-bold text-slate-800">{contract.category?.name || '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alt Tip</p>
                    <p className="text-[13px] font-bold text-slate-800">{contract.type?.name || '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ödeme Periyodu</p>
                    <p className="text-[13px] font-bold text-slate-800">{getPaymentFrequencyLabel(contract.paymentFrequency)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Management Tab Area */}
            <Tabs defaultValue="documents" className="w-full">
              <TabsList className="bg-white/50 border border-slate-200/60 p-1 rounded-xl mb-4">
                <TabsTrigger value="documents" className="rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  EK BELGELER ({contract.documents.length})
                </TabsTrigger>
                {!isPublic && (
                  <TabsTrigger value="notifications" className="rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    BİLDİRİM GEÇMİŞİ
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="documents" className="mt-0">
                <div className="stripe-card p-8 space-y-6">
                  {contract.documents.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {contract.documents.map((doc) => (
                        <div key={doc.id} className="group flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-100 transition-all cursor-pointer" onClick={() => handleDownload(doc.filename, doc.originalName)}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                              {getFileIcon(doc.mimeType)}
                            </div>
                            <div className="space-y-0.5 max-w-[150px]">
                              <p className="text-[12px] font-bold text-slate-900 truncate">{doc.originalName}</p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{formatFileSize(doc.fileSize)}</p>
                            </div>
                          </div>
                          <Download className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2">
                      <FileText className="mx-auto h-8 w-8 text-slate-200" />
                      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Henüz belge eklenmemiş</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <div className="stripe-card p-8 space-y-6">
                  {contract.notifications.length > 0 ? (
                    <div className="space-y-4">
                      {contract.notifications.map((n) => (
                        <div key={n.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", n.isSent ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600")}>
                            {n.isSent ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-bold text-slate-900">{n.subject}</p>
                              <Badge variant="outline" className="h-5 px-2 rounded-md text-[9px] font-black uppercase tracking-tighter">
                                {getNotificationTypeLabel(n.type)}
                              </Badge>
                            </div>
                            <p className="text-[12px] font-medium text-slate-500 leading-relaxed">{n.message}</p>
                            <div className="flex items-center gap-3 pt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">
                                Tetikleme: Vadeye {n.daysBefore} gün kala
                              </span>
                              {n.sentAt && (
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                                  Gönderildi: {format(new Date(n.sentAt), 'd MMM yyyy HH:mm', { locale: tr })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2">
                      <AlertCircle className="mx-auto h-8 w-8 text-slate-200" />
                      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Bildirim kaydı bulunamadı</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-700 delay-200">
            {/* Timeline / Dates Side Card */}
            <div className="stripe-card p-8 space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tarih Bilgisi</h3>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100/30">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-blue-100 flex items-center justify-center text-blue-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BAŞLANGIÇ</p>
                    <p className="text-[13px] font-bold text-slate-900">{format(new Date(contract.startDate), 'd MMMM yyyy', { locale: tr })}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-50/50 border border-orange-100/30">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-orange-100 flex items-center justify-center text-orange-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BİTİŞ / VADE</p>
                    <p className="text-[13px] font-bold text-slate-900">{format(new Date(contract.endDate), 'd MMMM yyyy', { locale: tr })}</p>
                  </div>
                </div>

                <div className={cn("p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3", contract.daysUntilExpiry <= 7 ? "bg-rose-50 border border-rose-100/50" : "bg-slate-50 border border-slate-100")}>
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform", contract.daysUntilExpiry <= 7 ? "bg-white text-rose-600 scale-110" : "bg-white text-blue-600")}>
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[24px] font-black text-slate-900 tracking-tight leading-none">{contract.daysUntilExpiry}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">GÜN KALDI</p>
                  </div>
                  <p className={cn("text-[11px] font-bold uppercase tracking-tight", contract.daysUntilExpiry <= 7 ? "text-rose-600 animate-pulse" : "text-slate-400")}>
                    {contract.daysUntilExpiry <= 0 ? 'SÜRE DOLDU' : contract.daysUntilExpiry <= 7 ? 'ACİL AKSİYON' : 'SÜREÇ NORMAL'}
                  </p>
                </div>
              </div>
            </div>

            {/* Parties Side Card */}
            <div className="stripe-card p-8 space-y-6 border-indigo-100 bg-indigo-50/5">
              <div className="flex items-center gap-3 border-b border-indigo-100 pb-6 mb-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-bold text-indigo-950 tracking-tight">Taraf Bilgileri</h3>
                  <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Müşteri / Tedarikçi</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1 text-center p-4 bg-white rounded-2xl border border-indigo-100/50 shadow-sm">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">FİRMA ÜNVANI</p>
                  <p className="text-sm font-black text-indigo-950 leading-tight">{contract.counterpartyName || '---'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Yetkili</p>
                    <p className="text-[12px] font-bold text-indigo-900">{contract.counterpartyContact || '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">İletişim</p>
                    <p className="text-[12px] font-bold text-indigo-900 truncate">{contract.counterpartyEmail || '---'}</p>
                    {contract.counterpartyPhone && (
                      <p className="text-[12px] font-bold text-indigo-900">{contract.counterpartyPhone}</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-indigo-100/50" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">İÇ SORUMLU (BİZDEN)</p>
                      <p className="text-[12px] font-bold text-indigo-950">{contract.internalResponsible || '---'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-400 flex items-center justify-center">
                      <Building className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">TALEBİ AÇAN BİRİM</p>
                      <p className="text-[12px] font-bold text-indigo-950">{contract.department}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ContractPrintTemplate contract={contract} />
      </div>
    </div>
  )
}