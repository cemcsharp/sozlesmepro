"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  CalendarIcon,
  Upload,
  X,
  Plus,
  ArrowLeft,
  FileText,
  Building2,
  LayoutGrid,
  Wallet2,
  Users2,
  Sparkles,
  ShieldCheck,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useFileUpload } from '@/hooks/useForm'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Department {
  id: string
  name: string
  email: string
}

interface Company {
  id: string
  name: string
  prefix: string
}

const CATEGORY_TYPE_MAPPING: Record<string, string[]> = {
  'SUPPLIER': ['PURCHASING', 'SERVICE_PROCUREMENT', 'CONSULTANCY', 'TECH_SUPPORT_SLA', 'CAR_RENTAL', 'KVKK', 'NDA', 'OTHER'],
  'CUSTOMER': ['SERVICE', 'REM_INSERT', 'REM_ESTORE', 'INSTORE', 'INDEPENDENT_AUDIT', 'SAAS', 'SHOPIER', 'KVKK', 'NDA', 'OTHER'],
  'PARTNERSHIP': ['PARTNERSHIP_AGREEMENT', 'OTHER']
}

export default function CreateContractPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [previewNumber, setPreviewNumber] = useState<string>('')
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const [defCategories, setDefCategories] = useState<any[]>([])
  const [defTypes, setDefTypes] = useState<any[]>([])
  const [defCurrencies, setDefCurrencies] = useState<any[]>([])
  const [defPaymentFrequencies, setDefPaymentFrequencies] = useState<any[]>([])

  const {
    values,
    errors,
    touched,
    isLoading,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError
  } = useForm<any>({
    initialValues: {
      subject: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      amount: '',
      currency: 'TRY',
      departmentId: '',
      companyId: '',
      category: '',
      type: '',
      paymentFrequency: 'ONE_TIME',
      companyRepresentative: '',
      contactInfo: '',
      internalResponsible: '',
      counterpartyName: '',
      counterpartyContact: '',
      counterpartyEmail: '',
      counterpartyPhone: '',
      status: 'ACTIVE'
    },
    validate: (values) => {
      const errors: any = {}
      if (!values.subject) errors.subject = 'Sözleşme konusu zorunludur'
      if (!values.companyId) errors.companyId = 'Şirket seçimi zorunludur'
      if (!values.departmentId) errors.departmentId = 'Birim seçimi zorunludur'
      if (!values.startDate) errors.startDate = 'Başlangıç tarihi zorunludur'
      if (!values.endDate) errors.endDate = 'Bitiş tarihi zorunludur'
      if (!values.amount) errors.amount = 'Tutar zorunludur'
      return errors
    },
    onSubmit: async (values) => {
      try {
        let addedDocumentsPayload: any[] = []
        if (draftFiles.length > 0) {
          const formData = new FormData()
          draftFiles.forEach(file => formData.append('files', file))
          const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData })
          const uploadResult = await uploadResponse.json()
          if (!uploadResponse.ok) {
            if (uploadResult.errors && uploadResult.errors.length > 0) throw new Error(uploadResult.errors.map((e: any) => e.message).join('\n'))
            throw new Error(uploadResult.message || 'Taslak dosya yükleme başarısız oldu')
          }
          addedDocumentsPayload.push(...(uploadResult?.data?.files || []).map((f: any) => ({ ...f, type: 'DRAFT_EDITABLE' })))
        }
        if (signedFiles.length > 0) {
          const formData = new FormData()
          signedFiles.forEach(file => formData.append('files', file))
          const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData })
          const uploadResult = await uploadResponse.json()
          if (!uploadResponse.ok) {
            if (uploadResult.errors && uploadResult.errors.length > 0) throw new Error(uploadResult.errors.map((e: any) => e.message).join('\n'))
            throw new Error(uploadResult.message || 'İmzalı dosya yükleme başarısız oldu')
          }
          addedDocumentsPayload.push(...(uploadResult?.data?.files || []).map((f: any) => ({ ...f, type: 'SIGNED_FINAL' })))
        }

        const response = await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...values,
            amount: parseFloat(values.amount),
            startDate: values.startDate.toISOString(),
            endDate: values.endDate.toISOString(),
            documents: addedDocumentsPayload
          }),
        })

        if (!response.ok) throw new Error('Sözleşme oluşturulamadı')
        const result = await response.json()
        toast({ title: "Başarılı", description: `Sözleşme başarıyla oluşturuldu. No: ${result.data?.contractNumber || '---'}` })
        router.push('/contracts')
      } catch (error) {
        toast({ title: "Hata", description: error instanceof Error ? error.message : 'Sözleşme oluşturulurken bir hata oluştu', variant: "destructive" })
      }
    }
  })

  useEffect(() => {
    const fetchNextNumber = async () => {
      if (!values?.companyId) { setPreviewNumber(''); return }
      try {
        const res = await fetch(`/api/contracts/next-number?companyId=${values.companyId}`)
        if (res.ok) {
          const json = await res.json()
          if (json.success) setPreviewNumber(json.data.nextNumber)
        }
      } catch { }
    }
    fetchNextNumber()
  }, [values?.companyId])

  useEffect(() => {
    if (!values?.companyId) {
      setDefCategories([]); setDefTypes([]); setDefCurrencies([]); setDefPaymentFrequencies([])
      return
    }
    const fetchDefinitions = async () => {
      try {
        const res = await fetch(`/api/definitions?companyId=${values.companyId}`)
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
            const data = json.data
            setDefCategories(data.filter((d: any) => d.type === 'CONTRACT_CATEGORY' && d.isActive))
            setDefTypes(data.filter((d: any) => d.type === 'CONTRACT_TYPE' && d.isActive))
            setDefCurrencies(data.filter((d: any) => d.type === 'CURRENCY' && d.isActive))
            setDefPaymentFrequencies(data.filter((d: any) => d.type === 'PAYMENT_FREQUENCY' && d.isActive))
          }
        }
      } catch { }
    }
    fetchDefinitions()
  }, [values?.companyId])

  const { files: draftFiles, handleFileChange: handleDraftFileChange, removeFile: removeDraftFile } = useFileUpload({
    maxFiles: 5, maxSize: 50 * 1024 * 1024,
    onSuccess: (files) => toast({ title: "Taslak Seçildi", description: `${files.length} dosya eklendi.` })
  })

  const { files: signedFiles, handleFileChange: handleSignedFileChange, removeFile: removeSignedFile } = useFileUpload({
    maxFiles: 5, maxSize: 50 * 1024 * 1024,
    onSuccess: (files) => toast({ title: "İmzalı Belge Seçildi", description: `${files.length} dosya eklendi.` })
  })

  useEffect(() => {
    loadDepartments(); loadCompanies()
    setLoading(false)
  }, [])

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const result = await response.json()
        if (result.success) setDepartments(result.data)
      }
    } catch { }
  }

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const result = await response.json()
        if (result.success) setCompanies(result.data)
      }
    } catch { }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFilteredTypes = () => {
    if (!values.category) return []
    const allowedCodes = CATEGORY_TYPE_MAPPING[values.category] || []
    if (allowedCodes.length === 0) return defTypes
    return defTypes.filter(t => allowedCodes.includes(t.code))
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-[3px] border-blue-100 border-t-blue-600"></div></div>
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="absolute top-0 left-0 right-0 h-[200px] bg-white border-b border-slate-200 pointer-events-none" />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 space-y-8">
        {/* Concise Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-1.5">
            <Link href="/contracts" className="group flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-blue-600 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Geri Dön
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Yeni Sözleşme Oluştur
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/50 border border-slate-100 px-4 py-2 rounded-lg flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Taslak No:</span>
              <span className="text-[13px] font-black text-blue-600 font-mono tracking-tight">{previewNumber || '---'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-6 duration-700 delay-100">
            <div className="stripe-card p-8 space-y-10">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Kurumsal Bilgiler</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kayıt kimliği ve sınıflandırma</p>
                </div>
              </div>

              <div className="space-y-6">
                <Label className="text-[13px] font-medium text-slate-700 pl-1">Sözleşme Konusu / Başlık *</Label>
                <Input
                  value={values.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  placeholder="Örn: 2026 Yılı Yazılım Hizmet Anlaşması"
                  className={cn("h-10 bg-white border-slate-200 rounded-md px-3 text-sm font-medium text-slate-900 transition-all", errors.subject && touched.subject && "border-rose-400")}
                />
                {errors.subject && touched.subject && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.subject}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-slate-700 pl-1">Açıklama</Label>
                <Textarea
                  value={values.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={2}
                  placeholder="Sözleşme hakkında kısa özet veya notlar..."
                  className="bg-white border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-900 min-h-[80px]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-700 pl-1">Şirket *</Label>
                  <Select value={values.companyId} onValueChange={(v) => setFieldValue('companyId', v)}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-md px-3 text-sm font-medium text-slate-900">
                      <SelectValue placeholder="Şirket Seçin" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-slate-200 shadow-md p-1">
                      {companies.map((c) => <SelectItem key={c.id} value={c.id} className="rounded-lg font-semibold">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-700 pl-1">Birim / Departman *</Label>
                  <Select value={values.departmentId} onValueChange={(v) => setFieldValue('departmentId', v)}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-md px-3 text-sm font-medium text-slate-900">
                      <SelectValue placeholder="Birim Seçin" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-slate-200 shadow-md p-1">
                      {departments.map((d) => <SelectItem key={d.id} value={d.id} className="rounded-lg font-semibold">{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-700 pl-1">Kategori</Label>
                  <Select value={values.category} onValueChange={(v) => { setFieldValue('category', v); setFieldValue('type', '') }}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-md px-3 text-sm font-medium text-slate-900">
                      <SelectValue placeholder="Kategori Seç" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-slate-200 shadow-md p-1">
                      {defCategories.map((cat) => <SelectItem key={cat.id} value={cat.code || cat.id} className="rounded-lg font-semibold">{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-700 pl-1">Tip</Label>
                  <Select value={values.type} onValueChange={(v) => setFieldValue('type', v)} disabled={!values.category}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-md px-3 text-sm font-medium text-slate-900">
                      <SelectValue placeholder="Tip Seçin" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-slate-200 shadow-md p-1">
                      {getFilteredTypes().map((t) => <SelectItem key={t.id} value={t.code || t.id} className="rounded-lg font-semibold">{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Finansal Detaylar Card */}
            <div className="stripe-card p-8 space-y-10">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Finansal Detaylar</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tutar ve ödeme planı</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-slate-700 pl-1">Sözleşme Tutarı *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={values.amount}
                        onChange={(e) => handleChange('amount', e.target.value)}
                        placeholder="0.00"
                        className="h-12 bg-white border-slate-200 rounded-lg px-4 text-base font-medium text-slate-900 font-mono"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 pointer-events-none tracking-widest">NET</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-slate-700 pl-1">Para Birimi</Label>
                    <Select value={values.currency} onValueChange={(v) => setFieldValue('currency', v)}>
                      <SelectTrigger className="h-10 border-slate-200 rounded-md px-3 text-sm font-medium text-slate-900">
                        <SelectValue placeholder="Seç..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-slate-200 shadow-md p-1">
                        {defCurrencies.map((c) => <SelectItem key={c.id} value={c.code || c.id} className="rounded-lg font-semibold">{c.name} ({c.code})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-700 pl-1">Ödeme Periyodu</Label>
                  <Select value={values.paymentFrequency} onValueChange={(v) => setFieldValue('paymentFrequency', v)}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-md px-3 text-sm font-medium text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-slate-200 shadow-md p-1">
                      {defPaymentFrequencies.map((f) => <SelectItem key={f.id} value={f.code || f.id} className="rounded-lg font-semibold">{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Document Management Card */}
            <div className="stripe-card p-8 space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Belge Yükleme Alanı</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taslak ve nihai sürümleri yükleyin</p>
                  </div>
                </div>
              </div>

              {/* Information Note */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-[12px] font-medium text-slate-700 leading-relaxed">
                  <strong>Bilgi:</strong> Sadece taslak hali (Word vb.) eklenip imzalı hali yüklenmeyen sözleşmeler için sistem tarafından <strong className="text-rose-600">2 haftada bir otomatik hatırlatma</strong> e-postası gönderilecektir. Sürecin tamamlanması için nihai kopya (PDF vb.) yüklendiğinden emin olunuz.
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Draft Zone */}
                <div className="space-y-4">
                  <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-wider pl-1 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Taslak Sözleşme <span className="text-[10px] text-slate-400 ml-auto lowercase">(.doc, .docx)</span>
                  </Label>
                  <div className="relative h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white hover:border-blue-400 transition-all overflow-hidden group/upload">
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 p-4 text-center">
                      <Upload className="h-6 w-6 text-slate-400 mb-2 group-hover/upload:text-blue-500 transition-colors" />
                      <h4 className="text-[12px] font-bold text-slate-700">Taslak Dosya Ekle</h4>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".doc,.docx,.rtf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                      onChange={handleDraftFileChange}
                    />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {draftFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="h-8 w-8 bg-blue-50 rounded flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-blue-600">WORD</span>
                          </div>
                          <div className="truncate">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{file.name}</p>
                            <p className="text-[9px] font-medium text-slate-400 uppercase">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeDraftFile(i)} className="h-7 w-7 text-slate-400 hover:text-rose-600">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signed Final Zone */}
                <div className="space-y-4">
                  <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-wider pl-1 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    İmzalı Nihai Kopya <span className="text-[10px] text-slate-400 ml-auto lowercase">(.pdf, .jpg)</span>
                  </Label>
                  <div className="relative h-32 border-2 border-dashed border-slate-200 rounded-xl bg-emerald-50/30 hover:bg-white hover:border-emerald-400 transition-all overflow-hidden group/upload">
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 p-4 text-center">
                      <Upload className="h-6 w-6 text-slate-400 mb-2 group-hover/upload:text-emerald-500 transition-colors" />
                      <h4 className="text-[12px] font-bold text-slate-700">İmzalı Belge Ekle</h4>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                      onChange={handleSignedFileChange}
                    />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {signedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="h-8 w-8 bg-emerald-50 rounded flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-emerald-600">PDF/IMG</span>
                          </div>
                          <div className="truncate">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{file.name}</p>
                            <p className="text-[9px] font-medium text-slate-400 uppercase">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeSignedFile(i)} className="h-7 w-7 text-slate-400 hover:text-rose-600">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Columns */}
          <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-700 delay-200">
            <div className="stripe-card p-8 space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tarih Bilgisi</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-700 pl-1">Başlangıç *</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-11 w-full justify-start text-left font-semibold rounded-lg bg-white border-slate-200 px-4 text-[13px]">
                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                        {values.startDate ? format(values.startDate, 'd MMMM yyyy', { locale: tr }) : 'Tarih Seçin'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-lg border-none shadow-2xl">
                      <Calendar
                        mode="single"
                        selected={values.startDate}
                        onSelect={(date) => {
                          if (date) {
                            setFieldValue('startDate', date)
                            setStartDateOpen(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && touched.startDate && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.startDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-700 pl-1">Bitiş *</Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-11 w-full justify-start text-left font-semibold rounded-lg bg-white border-slate-200 px-4 text-[13px]">
                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                        {values.endDate ? format(values.endDate, 'd MMMM yyyy', { locale: tr }) : 'Tarih Seçin'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-lg border-none shadow-2xl">
                      <Calendar
                        mode="single"
                        selected={values.endDate}
                        onSelect={(date) => {
                          if (date) {
                            setFieldValue('endDate', date)
                            setEndDateOpen(false)
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && touched.endDate && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.endDate}</p>}
                </div>
              </div>
            </div>

            <div className="stripe-card p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                <Users2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sorumlu Bilgileri</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-700 pl-1">Firma Temsilcisi (Bizden)</Label>
                  <Input value={values.companyRepresentative || ''} onChange={(e) => handleChange('companyRepresentative', e.target.value)} placeholder="Şirketimiz Adına İmzalayan" className="h-10 bg-white border-slate-200 rounded-lg px-3 text-[12px] font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-slate-700 pl-1">İç Sorumlu (Süreç Takibi)</Label>
                  <Input value={values.internalResponsible || ''} onChange={(e) => handleChange('internalResponsible', e.target.value)} placeholder="Sözleşmeyi Yöneten Kişi" className="h-10 bg-white border-slate-200 rounded-lg px-3 text-[12px] font-medium" />
                </div>
              </div>
            </div>

            <div className="stripe-card p-8 space-y-6 border-indigo-100 bg-indigo-50/10">
              <div className="flex items-center gap-3 border-b border-indigo-100 pb-6 mb-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-indigo-950 tracking-tight">Müşteri / Tedarikçi</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider pl-1 font-semibold font-semibold">Firma Adı / Unvanı</Label>
                  <Input value={values.counterpartyName || ''} onChange={(e) => handleChange('counterpartyName', e.target.value)} placeholder="A.Ş. / Ltd. Şti." className="h-10 bg-white border-indigo-100 rounded-lg px-3 text-[12px] font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider pl-1 font-semibold">Yetkili Kişi</Label>
                  <Input value={values.counterpartyContact || ''} onChange={(e) => handleChange('counterpartyContact', e.target.value)} placeholder="Ad Soyad" className="h-10 bg-white border-indigo-100 rounded-lg px-3 text-[12px] font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider pl-1 font-semibold">E-posta</Label>
                    <Input value={values.counterpartyEmail || ''} onChange={(e) => handleChange('counterpartyEmail', e.target.value)} placeholder="mail@ornek.com" className="h-10 bg-white border-indigo-100 rounded-lg px-3 text-[12px] font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider pl-1 font-semibold">Telefon</Label>
                    <Input value={values.counterpartyPhone || ''} onChange={(e) => handleChange('counterpartyPhone', e.target.value)} placeholder="05XX XXX XX XX" className="h-10 bg-white border-indigo-100 rounded-lg px-3 text-[12px] font-medium" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-sm transition-all"
              >
                {isLoading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
              </Button>
              <Link href="/contracts" className="block">
                <Button type="button" variant="ghost" className="w-full h-10 rounded-lg font-bold text-[10px] tracking-widest uppercase text-slate-400">Vazgeç</Button>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}