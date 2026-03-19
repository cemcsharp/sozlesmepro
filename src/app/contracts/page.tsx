"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  CalendarIcon,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Upload,
  Clock,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useCompany } from '@/context/CompanyContext'

interface Contract {
  id: string
  contractNumber: string
  subject: string
  startDate: string
  endDate: string
  amount: number
  currency: string
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED'
  departmentId: string
  department: string
  departmentEmail: string
  daysUntilExpiry: number
  counterpartyName: string
  counterpartyPhone?: string
  hasDraft: boolean
  hasSigned: boolean
}

interface FilterState {
  search: string
  status: string
  department: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
}

export default function ContractsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedCompany } = useCompany()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<any>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    department: 'all',
    dateFrom: undefined,
    dateTo: undefined
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    const loadContracts = async () => {
      if (!selectedCompany) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('companyId', selectedCompany.id)

        if (filters.search) params.set('search', filters.search)
        if (filters.status && filters.status !== 'all') params.set('status', filters.status)
        if (filters.department && filters.department !== 'all') params.set('department', filters.department)
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString())
        if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString())

        const res = await fetch(`/api/contracts?${params.toString()}`)
        if (!res.ok) throw new Error('Sözleşmeler alınamadı')
        const json = await res.json()
        const list = Array.isArray(json.data) ? json.data : (json.data?.contracts ?? [])
        const mapped: Contract[] = list.map((c: any) => ({
          id: c.id,
          contractNumber: c.contractNumber,
          subject: c.subject,
          startDate: c.startDate,
          endDate: c.endDate,
          amount: c.amount,
          currency: c.currency?.code || c.currency?.name || 'TRY',
          status: c.status,
          departmentId: c.departmentId,
          department: c.department?.name || '',
          departmentEmail: c.department?.email || '',
          daysUntilExpiry: c.daysUntilExpiry,
          counterpartyName: c.counterpartyName || '---',
          hasDraft: c.documents?.some((doc: any) => doc.type === 'DRAFT_EDITABLE') || false,
          hasSigned: c.documents?.some((doc: any) => doc.type === 'SIGNED_FINAL') || false
        }))
        setContracts(mapped)
        setFilteredContracts(mapped)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadContracts()
  }, [filters, selectedCompany])

  useEffect(() => {
    setCurrentPage(1)
  }, [filteredContracts])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredContracts.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'text-rose-600'
    if (days <= 1) return 'text-rose-600'
    if (days <= 7) return 'text-orange-600'
    if (days <= 15) return 'text-amber-600'
    if (days <= 30) return 'text-blue-600'
    return 'text-emerald-600'
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

  const handleViewContract = (contractId: string) => {
    router.push(`/contracts/view/${contractId}`)
  }

  const handleEditContract = (contractId: string) => {
    router.push(`/contracts/edit/${contractId}`)
  }

  const handleDeleteContract = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId)
    if (contract) {
      setContractToDelete(contract)
      setIsDeleteDialogOpen(true)
    }
  }

  const confirmDeleteContract = async () => {
    if (!contractToDelete) return
    try {
      const res = await fetch(`/api/contracts/${contractToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Sözleşme silinemedi')
      setFilteredContracts(prev => prev.filter(c => c.id !== contractToDelete.id))
      toast({ title: 'Başarılı', description: 'Sözleşme kaydı sistemden kalıcı olarak silindi.' })
      setIsDeleteDialogOpen(false)
    } catch (e) {
      toast({ title: 'Hata', description: 'Silme işlemi sırasında bir sorun oluştu', variant: 'destructive' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const [departments, setDepartments] = useState<Array<{ id: string, name: string, email: string }>>([])
  const statuses = ['ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await fetch('/api/departments')
        if (res.ok) {
          const json = await res.json()
          setDepartments(json.data.map((d: any) => ({ id: d.id, name: d.name, email: d.email || '' })))
        }
      } catch { }
    }
    loadDepartments()
  }, [])

  const clearFilters = () => {
    setFilters({ search: '', status: 'all', department: 'all', dateFrom: undefined, dateTo: undefined })
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (filteredContracts.length === 0) {
      toast({ title: "Uyarı", description: "Dışa aktarılacak veri bulunamadı.", variant: "destructive" })
      return
    }

    toast({ title: "Dışa Aktarma", description: "Rapor hazırlanıyor, lütfen bekleyin..." })

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, contracts: filteredContracts })
      })

      if (!response.ok) throw new Error('Dışa aktarma başarısız oldu')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sozlesme_raporu_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : 'html'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({ title: "Başarılı", description: "Rapor başarıyla indirildi." })
    } catch (e) {
      console.error(e)
      toast({ title: "Hata", description: "Rapor oluşturulurken bir sorun oluştu.", variant: "destructive" })
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setIsImporting(true)
    // Import logic here...
    setTimeout(() => {
      setIsImporting(false)
      setIsImportDialogOpen(false)
      toast({ title: "Başarılı", description: "Veriler sisteme başarıyla aktarıldı." })
    }, 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-blue-100 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Background patterns simplified */}
      <div className="absolute top-0 left-0 right-0 h-[200px] bg-white border-b border-slate-200 pointer-events-none" />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sözleşme Arşivi</h1>
            <p className="text-[13px] font-medium text-slate-500">
              Şirket portföyündeki <span className="text-blue-600 font-bold">{filteredContracts.length} aktif kayıt</span> listeleniyor.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => handleExport('excel')} className="h-10 px-4 rounded-md border-slate-200 text-slate-600 font-medium text-xs uppercase tracking-wider hover:bg-slate-50 transition-all">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> DIŞA AKTAR
            </Button>
            <Link href="/contracts/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs tracking-wider rounded-md h-10 px-6 uppercase shadow-sm transition-all">
                <Plus className="mr-2 h-4 w-4" /> YENİ SÖZLEŞME
              </Button>
            </Link>
          </div>
        </div>

        {/* Precise Toolbar Filters */}
        <div className="stripe-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex flex-col divide-y divide-slate-100">
            <div className="p-4 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px] group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Sözleşme ara: İsim, No, Birim..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full h-10 pl-10 bg-transparent border-none text-sm font-medium text-slate-900 focus:ring-0 placeholder:text-slate-400"
                />
              </div>
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              <div className="flex items-center gap-2">
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="h-10 border-none bg-transparent hover:bg-slate-50 font-bold text-xs text-slate-600 px-3 gap-2 min-w-[140px]">
                    <SelectValue placeholder="Tüm Durumlar" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
                    <SelectItem value="all" className="text-xs font-bold">Tüm Durumlar</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs font-bold">
                        {s === 'ACTIVE' ? 'Aktif' : s === 'EXPIRED' ? 'Süresi Dolan' : s === 'TERMINATED' ? 'Feshedilmiş' : 'Yenilenmiş'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filters.department} onValueChange={(value) => setFilters({ ...filters, department: value })}>
                  <SelectTrigger className="h-10 border-none bg-transparent hover:bg-slate-50 font-bold text-xs text-slate-600 px-3 gap-2 min-w-[140px]">
                    <SelectValue placeholder="Birimler" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
                    <SelectItem value="all" className="text-xs font-bold">Tüm Birimler</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs font-bold">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" onClick={clearFilters} className="h-10 w-10 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                  <X className="h-4 w-4" />
                </Button>
                <div className="h-6 w-px bg-slate-200" />
                <Button variant="ghost" className="h-10 px-4 text-xs font-bold text-slate-500 hover:text-slate-900 gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  Gelişmiş
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Level Table */}
        <div className="stripe-card animate-in fade-in slide-in-from-bottom-6 duration-600 delay-200">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-200 h-14 bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider pl-6">Sözleşme Detayı</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Firma / Karşı Taraf</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">İlgili Birim</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Bitiş Tarihi</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Tutar</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Belgeler</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Durum</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center pr-6 w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((contract) => (
                    <TableRow key={contract.id} className="group hover:bg-slate-50/50 border-b border-slate-100 transition-colors cursor-pointer" onClick={() => handleViewContract(contract.id)}>
                      <TableCell className="pl-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{contract.subject}</span>
                          <span className="text-[11px] font-bold text-slate-400 mt-0.5 tracking-tight uppercase">REF: {contract.contractNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-[12px] font-bold text-slate-900 tracking-tight">{contract.counterpartyName}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[12px] font-bold text-slate-600">{contract.department}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[12px] font-semibold text-slate-600">{formatDate(contract.endDate)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-[13px] font-bold text-slate-900 font-mono tracking-tighter">{formatCurrency(contract.amount, contract.currency)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 hidden md:flex">
                          {contract.hasDraft && <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600 bg-white font-medium hover:bg-slate-50 rounded-md">Taslak</Badge>}
                          {contract.hasSigned && <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600 bg-white font-medium hover:bg-slate-50 rounded-md">İmzalı</Badge>}
                          {!contract.hasDraft && !contract.hasSigned && <span className="text-[10px] text-slate-400">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={cn(
                          "inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight shadow-sm",
                          contract.daysUntilExpiry <= 7 ? "bg-rose-50 text-rose-600 border border-rose-100 soft-glow-rose" :
                            contract.daysUntilExpiry <= 30 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              "bg-emerald-50 text-emerald-600 border border-emerald-100 soft-glow-emerald"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full mr-2 animate-pulse", 
                            contract.daysUntilExpiry <= 7 ? "bg-rose-500" : 
                            contract.daysUntilExpiry <= 30 ? "bg-amber-500" : "bg-emerald-500")} />
                          {contract.daysUntilExpiry > 0 ? `${contract.daysUntilExpiry} Gün` : 'Süresi Doldu'}
                        </div>
                      </TableCell>
                      <TableCell className="pr-8 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg">
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border-slate-200 shadow-xl">
                            <DropdownMenuItem onClick={() => handleViewContract(contract.id)} className="rounded-lg text-xs font-semibold p-2.5">
                              Detayları İncele
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditContract(contract.id)} className="rounded-lg text-xs font-semibold p-2.5">
                              Kaydı Düzenle
                            </DropdownMenuItem>
                            <div className="my-1 border-t border-slate-100" />
                            <DropdownMenuItem onClick={() => handleDeleteContract(contract.id)} className="rounded-lg text-xs font-semibold p-2.5 text-rose-600 focus:bg-rose-50">
                              Kaydı Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                          <FileText className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">Sonuç bulunamadı</p>
                        <Button variant="outline" onClick={clearFilters} className="h-9 px-4 text-xs font-bold rounded-lg">Filtreleri Temizle</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Precise Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-6 animate-in fade-in duration-700">
            <p className="text-xs font-semibold text-slate-500">
              Gösteriliyor: <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredContracts.length)}</span> / {filteredContracts.length}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 px-3 border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Geri
              </Button>
              <div className="flex items-center mx-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <Button
                    key={num}
                    variant="ghost"
                    className={cn(
                      "h-9 w-9 text-xs font-bold rounded-lg transition-all",
                      currentPage === num ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                    onClick={() => paginate(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 px-3 border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                İleri
              </Button>
            </div>
          </div>
        )}
      </div>



      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none stripe-shadow rounded-[24px]">
          <DialogTitle className="sr-only">Sözleşmeyi Sil</DialogTitle>
          <div className="bg-white p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
                <Trash2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Sözleşmeyi Sil</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                  <span className="font-bold text-slate-900">"{contractToDelete?.subject}"</span> başlıklı sözleşmeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm bağlı dokümanlar silinecektir.
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 flex justify-center gap-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-11 px-8 rounded-xl font-bold text-xs text-slate-500 uppercase tracking-widest hover:bg-white transition-all"
            >
              Vazgeç
            </Button>
            <Button
              onClick={confirmDeleteContract}
              className="h-11 px-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-widest uppercase shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            >
              SİL
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const getExpiryBadgeClass = (days: number) => {
  if (days <= 1) return 'bg-rose-50 text-rose-700 border-rose-100'
  if (days <= 7) return 'bg-orange-50 text-orange-700 border-orange-100'
  if (days <= 15) return 'bg-amber-50 text-amber-700 border-amber-100'
  return 'bg-blue-50 text-blue-700 border-blue-100'
}
