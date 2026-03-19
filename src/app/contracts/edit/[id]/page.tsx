"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Users2,
  ShieldCheck,
  History,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface DocumentFile {
  id: string
  file: File
  preview: string
  serverData?: {
    id: string
    filename: string
    originalName: string
    filePath: string
    fileSize: number
    mimeType: string
    uploadDate: string
  }
}

interface ContractData {
  id: string
  contractNumber: string
  subject: string
  description: string
  startDate: Date
  endDate: Date
  amount: number
  currency: string
  department: string
  departmentEmail: string
  companyRepresentative?: string
  contactInfo?: string
  internalResponsible?: string
  counterpartyName?: string
  counterpartyContact?: string
  counterpartyEmail?: string
  counterpartyPhone?: string
  status: string
  documents: Array<{
    id: string
    filename: string
    originalName: string
    fileSize: number
    mimeType: string
  }>
  versions?: Array<{ id: string; version: number; createdAt: string }>
  changeLogs?: Array<{ id: string; field: string; oldValue?: string; newValue?: string; createdAt: string }>
}

export default function EditContractPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const contractId = params.id as string

  const [contractData, setContractData] = useState<ContractData | null>(null)
  const [formData, setFormData] = useState({
    contractNumber: '',
    subject: '',
    description: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    amount: '',
    currency: 'TRY',
    department: '',
    departmentEmail: '',
    companyRepresentative: '',
    contactInfo: '',
    internalResponsible: '',
    counterpartyName: '',
    counterpartyContact: '',
    counterpartyEmail: '',
    counterpartyPhone: '',
    status: 'ACTIVE'
  })

  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [draftDocuments, setDraftDocuments] = useState<DocumentFile[]>([])
  const [signedDocuments, setSignedDocuments] = useState<DocumentFile[]>([])
  const [existingDocuments, setExistingDocuments] = useState<any[]>([])
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [versions, setVersions] = useState<Array<{ id: string; version: number; createdAt: string }>>([])
  const [changeLogs, setChangeLogs] = useState<Array<{ id: string; field: string; oldValue?: string; newValue?: string; createdAt: string }>>([])
  const [editHistory, setEditHistory] = useState<Array<{ field: string; prev: any }>>([])
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ id: string; name: string; email?: string }>>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
  const [defCurrencies, setDefCurrencies] = useState<any[]>([])

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await fetch('/api/departments')
        const json = await res.json()
        const list = Array.isArray(json.data) ? json.data : []
        const mapped = list.map((d: any) => ({ id: d.id, name: d.name, email: d.email }))
        setDepartmentOptions(mapped)
      } catch (e) {
        console.error(e)
      }
    }
    loadDepartments()
  }, [])


  const statuses = [
    { value: 'ACTIVE', label: 'Aktif' },
    { value: 'EXPIRED', label: 'Süresi Dolmuş' },
    { value: 'TERMINATED', label: 'Feshedilmiş' },
    { value: 'RENEWED', label: 'Yenilenmiş' }
  ]

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/contracts/${contractId}`)
        if (!res.ok) throw new Error('Sözleşme verisi alınamadı')
        const json = await res.json()
        const c = json.data
        setContractData(c)
        setFormData({
          contractNumber: c.contractNumber,
          subject: c.subject,
          description: c.description || '',
          startDate: new Date(c.startDate),
          endDate: new Date(c.endDate),
          amount: String(c.amount),
          currency: c.currency?.code || c.currency?.id || (typeof c.currency === 'string' ? c.currency : 'TRY'),
          department: c.department?.name || '',
          departmentEmail: c.department?.email || '',
          companyRepresentative: c.companyRepresentative || '',
          contactInfo: c.contactInfo || '',
          internalResponsible: c.internalResponsible || '',
          counterpartyName: c.counterpartyName || '',
          counterpartyContact: c.counterpartyContact || '',
          counterpartyEmail: c.counterpartyEmail || '',
          counterpartyPhone: c.counterpartyPhone || '',
          status: c.status
        })
        setSelectedDepartmentId(c.department?.id || '')
        setExistingDocuments(c.documents || [])
        setVersions((c.versions || []).map((v: any) => ({ id: v.id, version: v.version, createdAt: v.createdAt })))
        setChangeLogs((c.changeLogs || []).map((l: any) => ({ id: l.id, field: l.field, oldValue: l.oldValue, newValue: l.newValue, createdAt: l.createdAt })))

        if (c.companyId) {
          try {
            const defRes = await fetch(`/api/definitions?companyId=${c.companyId}`)
            if (defRes.ok) {
              const defJson = await defRes.json()
              if (defJson.success && Array.isArray(defJson.data)) {
                setDefCurrencies(defJson.data.filter((d: any) => d.type === 'CURRENCY' && d.isActive))
              }
            }
          } catch (e) {
            console.error('Failed to fetch definitions', e)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [contractId])

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => {
      setEditHistory(h => [{ field, prev: (prev as any)[field] }, ...h])
      return { ...prev, [field]: value }
    })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const undoLastChange = () => {
    const [last, ...rest] = editHistory
    if (!last) return
    setFormData(prev => ({ ...prev, [last.field]: last.prev }))
    setEditHistory(rest)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'DRAFT_EDITABLE' | 'SIGNED_FINAL') => {
    const files = event.target.files
    if (!files) return

    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        // Validation errors form backend API
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors.map((e: any) => e.message).join('\n'))
        }
        throw new Error(result.message || 'Upload failed')
      }

      const filesData = Array.isArray(result?.data?.files) ? result.data.files : []
      if (filesData.length === 0) {
        throw new Error('Yüklenen dosya bulunamadı')
      }

      const newDocuments: DocumentFile[] = filesData.map((file: any, index: number) => ({
        id: file.id,
        file: files[index],
        preview: file.mimeType.startsWith('image/') ? URL.createObjectURL(files[index]) : '',
        serverData: { ...file, type }
      }))

      if (type === 'DRAFT_EDITABLE') {
        setDraftDocuments(prev => [...prev, ...newDocuments])
      } else {
        setSignedDocuments(prev => [...prev, ...newDocuments])
      }
    } catch (error: any) {
      console.error('Error uploading files:', error)
      toast({
        variant: 'destructive',
        title: 'Yükleme Başarısız',
        description: error.message || 'Dosya yükleme başarısız oldu'
      })
    }
  }

  const removeDocument = (id: string, type: 'DRAFT_EDITABLE' | 'SIGNED_FINAL') => {
    if (type === 'DRAFT_EDITABLE') {
      setDraftDocuments(prev => prev.filter(doc => doc.id !== id))
    } else {
      setSignedDocuments(prev => prev.filter(doc => doc.id !== id))
    }
  }

  const removeExistingDocument = (id: string) => {
    setExistingDocuments(prev => prev.filter(doc => doc.id !== id))
    setRemovedExistingIds(prev => [...prev, id])
  }

  const validateForm = () => {
    console.log('[DEBUG] validateForm started. Current formData:', formData);
    const newErrors: Record<string, string> = {}

    if (!(formData.contractNumber || '').trim()) {
      newErrors.contractNumber = 'Sözleşme numarası zorunludur'
    }

    if (!(formData.subject || '').trim()) {
      newErrors.subject = 'Sözleşme konusu zorunludur'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Başlangıç tarihi zorunludur'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Bitiş tarihi zorunludur'
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır'
    }

    if (!(String(formData.amount) || '').trim()) {
      newErrors.amount = 'Tutar zorunludur'
    } else if (isNaN(parseFloat(String(formData.amount))) || parseFloat(String(formData.amount)) <= 0) {
      newErrors.amount = 'Geçerli bir tutar giriniz'
    }

    if (!formData.department) {
      newErrors.department = 'Birim seçimi zorunludur'
    }

    setErrors(newErrors)
    console.log('[DEBUG] validateForm finished. Errors:', newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({
        variant: 'destructive',
        title: 'Eksik Alanlar',
        description: 'Lütfen kırmızı ile işaretli tüm zorunlu alanları doldurun.'
      })
    }
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[DEBUG] handleSubmit triggered');

    if (!validateForm()) {
      console.log('[DEBUG] Form validation failed, stopping submit process');
      return
    }

    setIsSubmitting(true)

    try {
      const payload: any = {
        contractNumber: formData.contractNumber,
        subject: formData.subject,
        description: formData.description || null,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        amount: formData.amount,
        currency: formData.currency,
        status: formData.status,
        departmentId: selectedDepartmentId || undefined,
        addedDocuments: [...draftDocuments.map(d => d.serverData), ...signedDocuments.map(d => d.serverData)].filter(Boolean),
        removedDocumentIds: removedExistingIds,
        companyRepresentative: formData.companyRepresentative,
        contactInfo: formData.contactInfo,
        internalResponsible: formData.internalResponsible,
        counterpartyName: formData.counterpartyName,
        counterpartyContact: formData.counterpartyContact,
        counterpartyEmail: formData.counterpartyEmail,
        counterpartyPhone: formData.counterpartyPhone
      }
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      console.log('[DEBUG] PUT /api/contracts response status:', res.status);
      
      const json = await res.json()
      console.log('[DEBUG] PUT /api/contracts response body:', json);

      if (!res.ok) {
        if (json.errors && json.errors.length > 0) throw new Error(json.errors.map((e: any) => e.message).join('\n'))
        throw new Error(json.message || 'Güncelleme başarısız')
      }

      const c = json.data
      setChangeLogs((c.changeLogs || []).map((l: any) => ({ id: l.id, field: l.field, oldValue: l.oldValue, newValue: l.newValue, createdAt: l.createdAt })))
      setVersions((c.versions || []).map((v: any) => ({ id: v.id, version: v.version, createdAt: v.createdAt })))
      setExistingDocuments(c.documents || [])
      setDraftDocuments([])
      setSignedDocuments([])
      setRemovedExistingIds([])
      toast({ title: 'Sözleşme güncellendi', description: 'Listeye yönlendiriliyor...' })
      router.push('/contracts')
    } catch (error: any) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Sözleşme güncellenirken bir hata oluştu.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitWithVersion = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const payload: any = {
        contractNumber: formData.contractNumber,
        subject: formData.subject,
        description: formData.description || null,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        amount: formData.amount,
        currency: formData.currency,
        status: formData.status,
        departmentId: selectedDepartmentId || undefined,
        addedDocuments: [...draftDocuments.map(d => d.serverData), ...signedDocuments.map(d => d.serverData)].filter(Boolean),
        removedDocumentIds: removedExistingIds,
        companyRepresentative: formData.companyRepresentative,
        contactInfo: formData.contactInfo,
        internalResponsible: formData.internalResponsible,
        counterpartyName: formData.counterpartyName,
        counterpartyContact: formData.counterpartyContact,
        counterpartyEmail: formData.counterpartyEmail,
        counterpartyPhone: formData.counterpartyPhone,
        createVersion: true
      }
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      console.log('[DEBUG] PUT /api/contracts (version) response status:', res.status);
      
      const json = await res.json()
      console.log('[DEBUG] PUT /api/contracts (version) response body:', json);

      if (!res.ok) {
        if (json.errors && json.errors.length > 0) throw new Error(json.errors.map((e: any) => e.message).join('\n'))
        throw new Error(json.message || 'Versiyonlu kayıt başarısız')
      }

      const c = json.data
      setChangeLogs((c.changeLogs || []).map((l: any) => ({ id: l.id, field: l.field, oldValue: l.oldValue, newValue: l.newValue, createdAt: l.createdAt })))
      setVersions((c.versions || []).map((v: any) => ({ id: v.id, version: v.version, createdAt: v.createdAt })))
      setExistingDocuments(c.documents || [])
      setDraftDocuments([])
      setSignedDocuments([])
      setRemovedExistingIds([])
      toast({ title: 'Sözleşme güncellendi', description: 'Listeye yönlendiriliyor...' })
      router.push('/contracts')
    } catch (error: any) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Versiyon kaydı sırasında hata oluştu.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevertVersion = async (version: number) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revert', revertVersion: version })
      })
      if (!res.ok) throw new Error('Versiyona dönüş başarısız')
      const json = await res.json()
      const c = json.data
      setFormData({
        contractNumber: c.contractNumber,
        subject: c.subject,
        description: c.description || '',
        startDate: new Date(c.startDate),
        endDate: new Date(c.endDate),
        amount: String(c.amount),
        currency: c.currency,
        department: c.department?.name || '',
        departmentEmail: c.department?.email || '',
        companyRepresentative: c.companyRepresentative || '',
        contactInfo: c.contactInfo || '',
        internalResponsible: c.internalResponsible || '',
        counterpartyName: c.counterpartyName || '',
        counterpartyContact: c.counterpartyContact || '',
        counterpartyEmail: c.counterpartyEmail || '',
        counterpartyPhone: c.counterpartyPhone || '',
        status: c.status
      })
      setSelectedDepartmentId(c.department?.id || '')
      setChangeLogs((c.changeLogs || []).map((l: any) => ({ id: l.id, field: l.field, oldValue: l.oldValue, newValue: l.newValue, createdAt: l.createdAt })))
      setVersions((c.versions || []).map((v: any) => ({ id: v.id, version: v.version, createdAt: v.createdAt })))
      toast({ title: 'Başarılı', description: 'Önceki versiyona dönüldü.' })
    } catch (error: any) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Versiyona dönme sırasında hata oluştu.'
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocumentData = (doc: DocumentFile) => {
    if (doc.serverData) {
      return {
        name: doc.serverData.originalName,
        size: doc.serverData.fileSize,
        type: doc.serverData.mimeType,
        extension: doc.serverData.originalName.split('.').pop()?.toUpperCase()
      }
    }
    return {
      name: doc.file.name,
      size: doc.file.size,
      type: doc.file.type,
      extension: doc.file.name.split('.').pop()?.toUpperCase()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
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
              Sözleşme Düzenle
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-md flex items-center gap-3 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sözleşme No:</span>
              <span className="text-[13px] font-black text-blue-600 font-mono tracking-tight">{formData.contractNumber}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-6 duration-700 delay-100">
              {/* Main Info */}
              <div className="stripe-card p-8 space-y-10">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Kayıt Detayları</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Temel sözleşme verileri</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-slate-700 pl-1">Sözleşme Konusu *</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className={cn("h-10 bg-white border-slate-200 rounded-md px-3 text-sm font-medium text-slate-900 transition-all", errors.subject && "border-rose-400")}
                    />
                    {errors.subject && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.subject}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-slate-700 pl-1">Açıklama</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={2}
                      className="bg-white border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-900 min-h-[80px]"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium text-slate-700 pl-1">Durum</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger className="h-10 border-slate-200 rounded-md px-3 text-sm font-medium text-slate-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border-slate-200 shadow-md p-1">
                          {statuses.map((status) => (
                            <SelectItem key={status.value} value={status.value} className="rounded-md font-medium">{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium text-slate-700 pl-1">Birim *</Label>
                      <Select value={selectedDepartmentId} onValueChange={(value) => {
                        const d = departmentOptions.find(x => x.id === value)
                        setSelectedDepartmentId(value)
                        handleInputChange('department', d?.name || '')
                        handleInputChange('departmentEmail', d?.email || '')
                      }}>
                        <SelectTrigger className={cn("h-11 border-slate-200 rounded-lg px-4 text-[13px] font-semibold text-slate-900", errors.department && "border-rose-400")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border-slate-200 shadow-md p-1">
                          {departmentOptions.map((department) => (
                            <SelectItem key={department.id} value={department.id || "unknown"} className="rounded-md font-medium">{department.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations & Counterparty - Separate Blocks */}
              <div className="space-y-6">
                <div className="stripe-card p-8 space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                    <Users2 className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sorumlu Bilgileri</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">İç Operasyon</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium text-slate-700 pl-1">Firma Temsilcisi (Bizden)</Label>
                      <Input value={formData.companyRepresentative || ''} onChange={(e) => handleInputChange('companyRepresentative', e.target.value)} placeholder="Şirketimiz Adına İmzalayan" className="h-10 bg-white border-slate-200 rounded-lg px-3 text-[12px] font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium text-slate-700 pl-1">İç Sorumlu (Süreç Takibi)</Label>
                      <Input value={formData.internalResponsible || ''} onChange={(e) => handleInputChange('internalResponsible', e.target.value)} placeholder="Sözleşmeyi Yöneten Kişi" className="h-10 bg-white border-slate-200 rounded-lg px-3 text-[12px] font-medium" />
                    </div>
                  </div>
                </div>

                <div className="stripe-card p-8 space-y-6 border-indigo-100 bg-indigo-50/10">
                  <div className="flex items-center gap-3 border-b border-indigo-100 pb-6 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-indigo-950 tracking-tight">Müşteri / Tedarikçi</h3>
                      <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Karşı Taraf Bilgileri</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider pl-1 font-semibold">Firma Adı / Unvanı</Label>
                      <Input value={formData.counterpartyName || ''} onChange={(e) => handleInputChange('counterpartyName', e.target.value)} placeholder="A.Ş. / Ltd. Şti." className="h-10 bg-white border-indigo-100 focus-visible:ring-indigo-500 rounded-lg px-3 text-[12px] font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider pl-1 font-semibold">Yetkili Kişi</Label>
                      <Input value={formData.counterpartyContact || ''} onChange={(e) => handleInputChange('counterpartyContact', e.target.value)} placeholder="Ad Soyad" className="h-10 bg-white border-indigo-100 focus-visible:ring-indigo-500 rounded-lg px-3 text-[12px] font-medium" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider pl-1 font-semibold">E-posta</Label>
                        <Input value={formData.counterpartyEmail || ''} onChange={(e) => handleInputChange('counterpartyEmail', e.target.value)} placeholder="mail@ornek.com" className="h-10 bg-white border-indigo-100 focus-visible:ring-indigo-500 rounded-lg px-3 text-[12px] font-medium" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider pl-1 font-semibold">Telefon</Label>
                        <Input value={formData.counterpartyPhone || ''} onChange={(e) => handleInputChange('counterpartyPhone', e.target.value)} placeholder="05XX XXX XX XX" className="h-10 bg-white border-indigo-100 focus-visible:ring-indigo-500 rounded-lg px-3 text-[12px] font-medium" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="stripe-card p-8 space-y-10">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Finansal Veriler</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tutar ve para birimi</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-slate-700 pl-1">Sözleşme Tutarı *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className={cn("h-11 bg-white border-slate-200 rounded-lg px-4 text-sm font-medium text-slate-900 font-mono", errors.amount && "border-rose-400")}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 pointer-events-none tracking-widest">NET</div>
                    </div>
                    {errors.amount && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.amount}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-slate-700 pl-1">Para Birimi</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger className="h-10 border-slate-200 rounded-md px-3 text-sm font-medium text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-slate-200 shadow-md p-1">
                        {defCurrencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.code || currency.id} className="rounded-md font-medium">{currency.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Document Management */}
              <div className="stripe-card p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Belge Yükleme Alanı</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taslak ve nihai sürümleri yükleyin</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Existing Documents */}
                  <div className="space-y-4 md:col-span-2">
                    <Label className="text-[13px] font-medium text-slate-700 pl-1">Mevcut Belgeler / Ekler</Label>
                    
                    {existingDocuments.length === 0 && <p className="text-[11px] font-medium text-slate-400 italic">Belge bulunamadı.</p>}

                    {/* Mevcut Taslaklar */}
                    {existingDocuments.filter(d => d.type === 'DRAFT_EDITABLE').length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-[10px] font-bold text-blue-600 mb-2 uppercase tracking-widest pl-1">Sisteme Yüklü Taslaklar</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {existingDocuments.filter(d => d.type === 'DRAFT_EDITABLE').map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-blue-50/30 border border-blue-100 rounded-lg group/doc hover:bg-white hover:shadow-sm transition-all m-0">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-white border border-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                                  <span className="text-[10px] font-bold text-blue-600">{doc.originalName.split('.').pop()?.toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="text-[12px] font-bold text-slate-800 truncate max-w-[140px] leading-tight">{doc.originalName}</p>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">{formatFileSize(doc.fileSize)} - TASLAK</p>
                                </div>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeExistingDocument(doc.id)} className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover/doc:opacity-100"><X className="h-4 w-4" /></Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mevcut İmzalı Belgeler */}
                    {existingDocuments.filter(d => d.type === 'SIGNED_FINAL').length > 0 && (
                      <div className="pt-4">
                        <h4 className="text-[10px] font-bold text-emerald-600 mb-2 uppercase tracking-widest pl-1">Sisteme Yüklü İmzalı Belgeler</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {existingDocuments.filter(d => d.type === 'SIGNED_FINAL').map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-emerald-50/30 border border-emerald-100 rounded-lg group/doc hover:bg-white hover:shadow-sm transition-all m-0">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-white border border-emerald-100 rounded-lg flex items-center justify-center shadow-sm">
                                  <span className="text-[10px] font-bold text-emerald-600">{doc.originalName.split('.').pop()?.toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="text-[12px] font-bold text-slate-800 truncate max-w-[140px] leading-tight">{doc.originalName}</p>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">{formatFileSize(doc.fileSize)} - İMZALI</p>
                                </div>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeExistingDocument(doc.id)} className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover/doc:opacity-100"><X className="h-4 w-4" /></Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Diğer Ekler */}
                    {existingDocuments.filter(d => d.type !== 'DRAFT_EDITABLE' && d.type !== 'SIGNED_FINAL').length > 0 && (
                      <div className="pt-4">
                        <h4 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest pl-1">Diğer Ekler</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {existingDocuments.filter(d => d.type !== 'DRAFT_EDITABLE' && d.type !== 'SIGNED_FINAL').map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-lg group/doc hover:bg-white hover:shadow-sm transition-all m-0">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                                  <span className="text-[10px] font-bold text-slate-400">{doc.originalName.split('.').pop()?.toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="text-[12px] font-bold text-slate-800 truncate max-w-[140px] leading-tight">{doc.originalName}</p>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">{formatFileSize(doc.fileSize)} - EK</p>
                                </div>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeExistingDocument(doc.id)} className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover/doc:opacity-100"><X className="h-4 w-4" /></Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Draft Zone */}
                  <div className="space-y-4">
                    <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-wider pl-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Taslak Ekle <span className="text-[10px] text-slate-400 ml-auto lowercase">(.doc, .docx)</span>
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
                        onChange={(e) => handleFileUpload(e, 'DRAFT_EDITABLE')}
                      />
                    </div>
                    {draftDocuments.length > 0 && (
                      <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                        {draftDocuments.map((doc) => {
                          const docData = getDocumentData(doc)
                          return (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-blue-50/30 border border-blue-100 rounded-lg hover:shadow-sm">
                              <span className="text-[11px] font-bold text-blue-600 truncate max-w-[150px] ml-2">{docData.name}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument(doc.id, 'DRAFT_EDITABLE')} className="h-7 w-7 rounded-lg text-blue-400 hover:text-rose-600"><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Signed Final Zone */}
                  <div className="space-y-4">
                    <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-wider pl-1 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      İmzalı Belge Ekle <span className="text-[10px] text-slate-400 ml-auto lowercase">(.pdf, .jpg)</span>
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
                        onChange={(e) => handleFileUpload(e, 'SIGNED_FINAL')}
                      />
                    </div>
                    {signedDocuments.length > 0 && (
                      <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                        {signedDocuments.map((doc) => {
                          const docData = getDocumentData(doc)
                          return (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg hover:shadow-sm">
                              <span className="text-[11px] font-bold text-slate-800 truncate max-w-[150px] ml-2">{docData.name}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument(doc.id, 'SIGNED_FINAL')} className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600"><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-700 delay-200">
              {/* Validity Dates */}
              <div className="stripe-card p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-6 mb-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Geçerlilik</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-slate-700 pl-1">Başlangıç *</Label>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-10 w-full justify-start text-left font-medium rounded-md bg-white border-slate-200 px-3 text-sm">
                          <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                          {formData.startDate ? format(formData.startDate, 'd MMMM yyyy', { locale: tr }) : 'Tarih seçin'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-lg shadow-2xl border-none">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => {
                            if (date) {
                              handleInputChange('startDate', date)
                              setStartDateOpen(false)
                            }
                          }}
                          initialFocus
                          captionLayout="dropdown"
                          fromYear={1990}
                          toYear={2100}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.startDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-slate-700 pl-1">Bitiş *</Label>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-10 w-full justify-start text-left font-medium rounded-md bg-white border-slate-200 px-3 text-sm">
                          <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                          {formData.endDate ? format(formData.endDate, 'd MMMM yyyy', { locale: tr }) : 'Tarih seçin'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-lg shadow-2xl border-none">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => {
                            if (date) {
                              handleInputChange('endDate', date)
                              setEndDateOpen(false)
                            }
                          }}
                          initialFocus
                          captionLayout="dropdown"
                          fromYear={1990}
                          toYear={2100}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.endDate && <p className="text-[10px] font-bold text-rose-500 uppercase px-1">{errors.endDate}</p>}
                  </div>
                </div>
              </div>

              {/* History and Versions */}
              <div className="stripe-card p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">Süreç Geçmişi</h4>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={undoLastChange} disabled={editHistory.length === 0} className="h-7 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:bg-white transition-all shadow-sm">
                    <RotateCcw className="h-3 w-3 mr-1.5" /> Geri Al
                  </Button>
                </div>

                <div className="p-6 space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DEĞİŞİKLİKLER</span>
                      <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{changeLogs.length}</span>
                    </div>
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {changeLogs.length === 0 && <p className="text-[10px] text-slate-400 italic">Henüz değişiklik yapılmadı.</p>}
                      {changeLogs.map(log => (
                        <div key={log.id} className="p-3 bg-slate-50/50 border border-slate-100/50 rounded-lg space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{log.field}</span>
                            <span className="text-[9px] font-medium text-slate-400">{format(new Date(log.createdAt), 'HH:mm')}</span>
                          </div>
                          <div className="text-[10px] flex items-center gap-2 text-slate-500 font-medium">
                            <span className="line-through text-slate-300">{log.oldValue || '-'}</span>
                            <span className="text-blue-600">→ {log.newValue || '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VERSİYONLAR</span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{versions.length}</span>
                    </div>
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {versions.length === 0 && <p className="text-[10px] text-slate-400 italic">Versiyon kaydı yok.</p>}
                      {versions.map(v => (
                        <div key={v.id} className="p-3 bg-white border border-slate-100 rounded-lg flex items-center justify-between group/v transition-all hover:border-blue-200">
                          <div>
                            <p className="text-[11px] font-bold text-slate-800">Versiyon {v.version}</p>
                            <p className="text-[9px] font-medium text-slate-400">{format(new Date(v.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}</p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRevertVersion(v.version)} className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-blue-600 opacity-0 group-hover/v:opacity-100 transition-all hover:bg-blue-50">Dön</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button type="submit" disabled={isSubmitting} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-sm transition-all">
                  {isSubmitting ? 'Güncelleniyor...' : 'Kayıt Güncelle'}
                </Button>
                <Button type="button" variant="outline" onClick={handleSubmitWithVersion} disabled={isSubmitting} className="w-full h-10 bg-white border-blue-200 text-blue-600 font-medium text-sm rounded-md hover:bg-blue-50 transition-all">
                  {isSubmitting ? 'İşleniyor...' : 'Yeni Versiyon Olarak Kaydet'}
                </Button>
                <Link href="/contracts" className="block">
                  <Button type="button" variant="ghost" className="w-full h-10 rounded-lg font-bold text-[10px] tracking-widest uppercase text-slate-400">Vazgeç</Button>
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}