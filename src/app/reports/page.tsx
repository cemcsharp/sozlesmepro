"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar as CalendarIcon,
  Download,
  Filter,
  FileText,
  FileSpreadsheet,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building,
  Users
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'

interface ReportData {
  totalContracts: number
  activeContracts: number
  expiredContracts: number
  totalValue: number
  averageContractValue: number
  contractsByDepartment: Array<{
    department: string
    count: number
    value: number
  }>
  contractsByStatus: Array<{
    status: string
    count: number
    value: number
  }>
  contractsExpiring: Array<{
    days: number
    count: number
  }>
  monthlyTrends: Array<{
    month: string
    created: number
    expired: number
    value: number
  }>
  topDepartments: Array<{
    department: string
    contractCount: number
    totalValue: number
    avgValue: number
  }>
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date())
  })
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    loadReportData()
  }, [dateRange, selectedDepartment, selectedStatus])

  const loadReportData = () => {
    // Mock data for demonstration
    const mockData: ReportData = {
      totalContracts: 156,
      activeContracts: 142,
      expiredContracts: 14,
      totalValue: 2850000,
      averageContractValue: 18269,
      contractsByDepartment: [
        { department: 'Bilgi Teknolojileri', count: 45, value: 850000 },
        { department: 'İdari İşler', count: 32, value: 620000 },
        { department: 'İnsan Kaynakları', count: 28, value: 480000 },
        { department: 'Satın Alma', count: 25, value: 420000 },
        { department: 'Pazarlama', count: 18, value: 350000 },
        { department: 'Finans', count: 8, value: 130000 }
      ],
      contractsByStatus: [
        { status: 'ACTIVE', count: 142, value: 2650000 },
        { status: 'EXPIRED', count: 14, value: 200000 }
      ],
      contractsExpiring: [
        { days: 30, count: 8 },
        { days: 15, count: 5 },
        { days: 7, count: 3 },
        { days: 1, count: 1 }
      ],
      monthlyTrends: [
        { month: 'Haz 2024', created: 12, expired: 2, value: 280000 },
        { month: 'Tem 2024', created: 15, expired: 1, value: 320000 },
        { month: 'Ağu 2024', created: 18, expired: 3, value: 380000 },
        { month: 'Eyl 2024', created: 22, expired: 2, value: 450000 },
        { month: 'Eki 2024', created: 25, expired: 4, value: 520000 },
        { month: 'Kas 2024', created: 28, expired: 2, value: 580000 },
        { month: 'Ara 2024', created: 20, expired: 0, value: 420000 }
      ],
      topDepartments: [
        { department: 'Bilgi Teknolojileri', contractCount: 45, totalValue: 850000, avgValue: 18889 },
        { department: 'İdari İşler', contractCount: 32, totalValue: 620000, avgValue: 19375 },
        { department: 'İnsan Kaynakları', contractCount: 28, totalValue: 480000, avgValue: 17143 },
        { department: 'Satın Alma', contractCount: 25, totalValue: 420000, avgValue: 16800 },
        { department: 'Pazarlama', contractCount: 18, totalValue: 350000, avgValue: 19444 }
      ]
    }

    setReportData(mockData)
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
      }).format(amount)
    } catch (e) {
      return `${amount} TRY`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'EXPIRED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Aktif'
      case 'EXPIRED': return 'Süresi Dolmuş'
      default: return status
    }
  }

  const getExpiryColor = (days: number) => {
    if (days <= 1) return 'text-red-600'
    if (days <= 7) return 'text-orange-600'
    if (days <= 15) return 'text-yellow-600'
    if (days <= 30) return 'text-blue-600'
    return 'text-green-600'
  }

  const handleExportReport = (format: 'excel' | 'pdf') => {
    // Mock export functionality
    alert(`Rapor ${format === 'excel' ? 'Excel' : 'PDF'} formatında dışa aktarılıyor...`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Rapor Verisi Bulunamadı</h2>
          <p className="text-muted-foreground">Rapor oluşturmak için yeterli veri bulunamadı.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporlar ve Analiz</h1>
          <p className="text-muted-foreground">
            Sözleşme yönetimi ile ilgili detaylı raporlar ve analizler
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline">
              Ana Sayfa
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Dışa Aktar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportReport('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel Raporu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportReport('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                PDF Raporu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Rapor Filtreleri
          </CardTitle>
          <CardDescription>
            Raporlamak istediğiniz tarih aralığını ve kriterleri seçin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Başlangıç Tarihi</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, 'PPP', { locale: tr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date || prev.from }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bitiş Tarihi</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.to, 'PPP', { locale: tr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date || prev.to }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Birim</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Birim seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Birimler</SelectItem>
                  {reportData.contractsByDepartment.map((dept) => (
                    <SelectItem key={dept.department} value={dept.department || "unknown"}>
                      {dept.department || "Bilinmeyen Birim"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  {reportData.contractsByStatus.map((status) => (
                    <SelectItem key={status.status} value={status.status || "unknown"}>
                      {getStatusLabel(status.status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sözleşme</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.activeContracts} aktif, {reportData.expiredContracts} süresi dolmuş
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Ortalama: {formatCurrency(reportData.averageContractValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Oranı</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((reportData.activeContracts / reportData.totalContracts) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.activeContracts} / {reportData.totalContracts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yaklaşan Bitiş</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reportData.contractsExpiring.reduce((sum, item) => sum + item.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              30 gün içinde bitecek
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="tabs-container">
          <TabsTrigger value="overview" className="tabs-trigger">Genel Bakış</TabsTrigger>
          <TabsTrigger value="departments" className="tabs-trigger">Birim Analizi</TabsTrigger>
          <TabsTrigger value="trends" className="tabs-trigger">Trendler</TabsTrigger>
          <TabsTrigger value="expiring" className="tabs-trigger">Sona Erenler</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Durum Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.contractsByStatus.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
                        <span className="text-sm font-medium">{getStatusLabel(status.status)}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{status.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(status.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Sona Eren Sözleşmeler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.contractsExpiring.map((expiry) => (
                    <div key={expiry.days} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">{expiry.days} gün</span>
                      </div>
                      <Badge variant={expiry.days <= 7 ? 'destructive' : 'secondary'}>
                        {expiry.count} sözleşme
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Birim Bazında Analiz
              </CardTitle>
              <CardDescription>
                Birimlere göre sözleşme dağılımı ve değerleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.contractsByDepartment.map((dept) => (
                  <div key={dept.department} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{dept.department}</h3>
                      <p className="text-sm text-muted-foreground">
                        {dept.count} sözleşme
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(dept.value)}</div>
                      <div className="text-sm text-muted-foreground">
                        Ortalama: {formatCurrency(dept.value / dept.count)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>En Aktif Birimler</CardTitle>
              <CardDescription>
                Sözleşme sayısına göre en aktif birimler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topDepartments.map((dept, index) => (
                  <div key={dept.department} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{dept.department}</h3>
                        <p className="text-sm text-muted-foreground">
                          {dept.contractCount} sözleşme
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(dept.totalValue)}</div>
                      <div className="text-sm text-muted-foreground">
                        Ortalama: {formatCurrency(dept.avgValue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Aylık Trendler
              </CardTitle>
              <CardDescription>
                Sözleşme oluşturma ve bitiş trendleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.monthlyTrends.map((trend) => (
                  <div key={trend.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{trend.month}</h3>
                      <p className="text-sm text-muted-foreground">
                        {trend.created} oluşturuldu, {trend.expired} bitti
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(trend.value)}</div>
                      <div className="text-sm text-muted-foreground">
                        Toplam değer
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sona Eren Sözleşme Detayı
              </CardTitle>
              <CardDescription>
                Süresi yaklaşan sözleşmelerin detaylı analizi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {reportData.contractsExpiring.map((expiry) => (
                  <Card key={expiry.days} className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        {expiry.days} Gün Kala
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Sözleşme Sayısı:</span>
                          <span className="font-semibold">{expiry.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Öncelik:</span>
                          <Badge variant={expiry.days <= 7 ? 'destructive' : 'secondary'}>
                            {expiry.days <= 7 ? 'Yüksek' : expiry.days <= 15 ? 'Orta' : 'Düşük'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}