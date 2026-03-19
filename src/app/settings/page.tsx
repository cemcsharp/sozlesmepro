"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { ToastClose } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { Settings, Mail, Plus, Edit, Trash2, TestTube, Bell, Send, Building2, Users, LayoutGrid, ShieldCheck, Database, History, ChevronRight, CheckCircle2, AlertCircle, Download, Upload } from 'lucide-react'
import Link from 'next/link'
import { CompaniesSection } from './CompaniesSection'
import { DefinitionsManager } from '@/components/DefinitionsManager'

interface SmtpConfig {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  fromEmail: string
  fromName: string
  secure: boolean
  isActive: boolean
}

interface Notification {
  id: string
  type: string
  daysBefore: number
  subject: string
  message: string
  isSent: boolean
  sentAt?: string
  createdAt: string
  contract: {
    id: string
    subject: string
    contractNumber: string
    department: {
      name: string
      email: string
    }
  }
}

interface Department {
  id: string
  name: string
  email: string
  description?: string
  createdAt: string
  contractCount: number
  _count?: {
    contracts: number
  }
}

function UsersSection() {
  const { toast } = useToast()
  const [users, setUsers] = useState<Array<{ id: string; email: string; name: string; role: 'ADMIN' | 'USER'; createdAt: string; companies: Array<{ id: string; name: string }> }>>([])
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' as 'ADMIN' | 'USER', companyIds: [] as string[] })
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', role: 'USER' as 'ADMIN' | 'USER', companyIds: [] as string[] })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, companiesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/companies')
        ])

        if (usersRes.ok) {
          const json = await usersRes.json()
          setUsers(Array.isArray(json?.data?.users) ? json.data.users : [])
        }

        if (companiesRes.ok) {
          const json = await companiesRes.json()
          setCompanies(json.data || [])
        }
      } catch (e) {
        toast({ title: 'Hata', description: 'Veriler yüklenemedi', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const addUser = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen tüm alanları doldurun', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          companyIds: form.companyIds
        })
      })
      if (!res.ok) {
        const err = await res.json()
        toast({ title: 'Hata', description: err.message || 'Kullanıcı eklenemedi', variant: 'destructive' })
        return
      }
      const json = await res.json()
      setUsers(prev => [...prev, json.data])
      setForm({ name: '', email: '', password: '', role: 'USER', companyIds: [] })
      toast({ title: 'Başarılı', description: 'Kullanıcı eklendi' })
    } catch (e) {
      toast({ title: 'Hata', description: 'Bağlantı sorunu oluştu', variant: 'destructive' })
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
          companyIds: editForm.companyIds,
          ...(editForm.password ? { password: editForm.password } : {})
        })
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setUsers(prev => prev.map(u => u.id === editingUser.id ? json.data : u))
      setEditOpen(false)
      setEditingUser(null)
      toast({ title: 'Başarılı', description: 'Kullanıcı güncellendi' })
    } catch {
      toast({ title: 'Hata', description: 'Güncelleme yapılamadı', variant: 'destructive' })
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setUsers(prev => prev.filter(u => u.id !== id))
      toast({ title: 'Silindi', description: 'Kullanıcı başarıyla silindi' })
    } catch {
      toast({ title: 'Hata', description: 'Kullanıcı silinemedi', variant: 'destructive' })
    }
  }

  const toggleCompany = (id: string, isEdit = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        companyIds: prev.companyIds.includes(id)
          ? prev.companyIds.filter(cid => cid !== id)
          : [...prev.companyIds, id]
      }))
    } else {
      setForm(prev => ({
        ...prev,
        companyIds: prev.companyIds.includes(id)
          ? prev.companyIds.filter(cid => cid !== id)
          : [...prev.companyIds, id]
      }))
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" /> YENİ KULLANICI
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AD SOYAD</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="bg-white border-slate-100 rounded-xl h-11 text-sm font-medium" placeholder="Örn: Ahmet Yılmaz" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-POSTA</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="bg-white border-slate-100 rounded-xl h-11 text-sm font-medium" placeholder="ahmet@sirket.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ŞİFRE</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} className="bg-white border-slate-100 rounded-xl h-11 text-sm font-medium" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">YETKİ ROLÜ</Label>
                <select value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value as any }))} className="w-full bg-white border-slate-100 border rounded-xl h-11 text-sm font-medium px-3 outline-none">
                  <option value="USER">STANDART KULLANICI</option>
                  <option value="ADMIN">SİSTEM YÖNETİCİSİ</option>
                </select>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ŞİRKET ATAMASI</Label>
                <div className="max-h-40 overflow-y-auto p-3 bg-white border border-slate-100 rounded-xl space-y-2">
                  {companies.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.companyIds.includes(c.id)}
                        onChange={() => toggleCompany(c.id)}
                        className="rounded border-slate-200 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{c.name}</span>
                    </label>
                  ))}
                  {companies.length === 0 && <p className="text-[10px] text-slate-400 font-bold italic">Önce şirket eklemelisiniz.</p>}
                </div>
              </div>

              <Button onClick={addUser} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl h-11 tracking-widest mt-2 uppercase shadow-md transition-all">
                HESABI OLUŞTUR
              </Button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden border border-slate-50 rounded-2xl">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6">KULLANICI</TableHead>
                  <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">YETKİLİ ŞİRKETLER</TableHead>
                  <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">İŞLEM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center text-slate-400 font-bold">Yükleniyor...</TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center text-slate-400 font-bold">Kayıt yok.</TableCell></TableRow>
                ) : users.map(u => (
                  <TableRow key={u.id} className="group hover:bg-slate-50/50 transition-all">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{u.name}</span>
                          <Badge className={cn(
                            "font-black text-[8px] rounded-md h-4 px-1.5 tracking-tighter border-none",
                            u.role === 'ADMIN' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {u.role === 'ADMIN' ? 'ADM' : 'USR'}
                          </Badge>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {u.companies?.length > 0 ? (
                          u.companies.map(c => (
                            <Badge key={c.id} variant="outline" className="text-[9px] font-black text-slate-500 border-slate-200">
                              {c.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold text-rose-400 italic">Erişim Atanmadı</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingUser(u)
                        setEditForm({
                          name: u.name,
                          email: u.email,
                          password: '',
                          role: u.role,
                          companyIds: u.companies?.map(c => c.id) || []
                        })
                        setEditOpen(true)
                      }} className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)} className="h-8 w-8 text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Kullanıcı Düzenle</DialogTitle>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">HESAP BİLGİLERİNİ VE YETKİLERİ GÜNCELLEYİN</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">AD SOYAD</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} className="bg-slate-50 border-none rounded-xl h-12 font-bold px-4" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">E-POSTA</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} className="bg-slate-50 border-none rounded-xl h-12 font-bold px-4" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">YENİ ŞİFRE (OPSİYONEL)</Label>
                <Input type="password" value={editForm.password} onChange={(e) => setEditForm(p => ({ ...p, password: e.target.value }))} className="bg-slate-50 border-none rounded-xl h-12 font-bold px-4" placeholder="Değiştirmek istemiyorsanız boş bırakın" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">YETKİ ROLÜ</Label>
                <select value={editForm.role} onChange={(e) => setEditForm(p => ({ ...p, role: e.target.value as any }))} className="w-full bg-slate-50 border-none rounded-xl h-12 font-bold px-3 outline-none">
                  <option value="USER">STANDART KULLANICI</option>
                  <option value="ADMIN">SİSTEM YÖNETİCİSİ</option>
                </select>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ŞİRKET ATAMASI</Label>
                <div className="max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-xl space-y-2">
                  {companies.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={editForm.companyIds.includes(c.id)}
                        onChange={() => toggleCompany(c.id, true)}
                        className="rounded border-slate-200 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-xs text-slate-400 tracking-widest uppercase">İPTAL</Button>
              <Button onClick={handleUpdateUser} className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs tracking-widest uppercase shadow-xl transition-all">GÜNCELLE</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSmtpDialog, setShowAddSmtpDialog] = useState(false)
  const [showEditSmtpDialog, setShowEditSmtpDialog] = useState(false)
  const [editingSmtp, setEditingSmtp] = useState<SmtpConfig | null>(null)
  const [newSmtp, setNewSmtp] = useState<Partial<SmtpConfig>>({
    name: '', host: '', port: 587, username: '', password: '', fromEmail: '', fromName: '', secure: true, isActive: false
  })

  const [departments, setDepartments] = useState<Department[]>([])
  const [deptLoading, setDeptLoading] = useState(true)
  const [deptShowAddDialog, setDeptShowAddDialog] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [newDepartment, setNewDepartment] = useState({ name: '', email: '', description: '' })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    loadSmtpConfigs()
    loadNotifications()
    loadDepartments()
  }, [])

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/backup/export')
      if (!res.ok) throw new Error('Yedek alınamadı')
      const json = await res.json()
      if (!json.success) throw new Error(json.message)

      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sozlesmepro_yedek_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      toast({ title: 'Başarılı', description: 'Yedek dosyası indirildi.' })
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleImportData = async () => {
    if (!selectedFile) return
    if (!confirm('Tüm mevcut veriler silinecek ve yedekteki veriler yüklenecek. Onaylıyor musunuz?')) return

    try {
      const text = await selectedFile.text()
      const parsed = JSON.parse(text)
      
      // If the backup was exported via the API, it wraps data inside `{ success: true, data: {...} }`
      const actualData = parsed.data ? parsed.data : parsed

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: actualData })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast({ title: 'Başarılı', description: 'Yedek yüklendi. Sayfa yenileniyor...' })
      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' })
    }
  }

  const loadSmtpConfigs = async () => {
    try {
      const res = await fetch('/api/smtp')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setSmtpConfigs(Array.isArray(json?.data?.configs) ? json.data.configs : [])
    } catch {
      toast({ title: 'Hata', description: 'Sunucu ayarlarına erişilemedi.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setNotifications(Array.isArray(json?.data?.notifications) ? json.data.notifications : [])
    } catch {
      toast({ title: 'Hata', description: 'Bildirimler yüklenemedi.', variant: 'destructive' })
    }
  }

  const handleAddSmtp = async () => {
    try {
      const res = await fetch('/api/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSmtp)
      })
      if (!res.ok) throw new Error()
      setShowAddSmtpDialog(false)
      toast({ title: 'Başarılı', description: 'E-posta servisi eklendi.' })
      loadSmtpConfigs()
    } catch {
      toast({ title: 'Hata', description: 'İşlem başarısız.', variant: 'destructive' })
    }
  }

  const handleSetActiveSmtp = async (id: string) => {
    const res = await fetch('/api/smtp', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-active', id })
    })
    if (res.ok) {
      toast({ title: 'Aktif', description: 'Varsayılan servis güncellendi.' })
      loadSmtpConfigs()
    }
  }

  const handleDeleteSmtp = async (id: string) => {
    const res = await fetch(`/api/smtp?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Silindi', description: 'Servis silindi.' })
      loadSmtpConfigs()
    }
  }

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setDepartments(json.data)
    } finally {
      setDeptLoading(false)
    }
  }

  const handleAddDepartment = async () => {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDepartment)
    })
    if (res.ok) {
      loadDepartments()
      setDeptShowAddDialog(false)
      setNewDepartment({ name: '', email: '', description: '' })
      toast({ title: 'Başarılı', description: 'Birim oluşturuldu.' })
    }
  }

  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return
    const res = await fetch(`/api/departments/${editingDepartment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDepartment)
    })
    if (res.ok) {
      loadDepartments()
      setEditingDepartment(null)
      setDeptShowAddDialog(false)
      toast({ title: 'Güncellendi', description: 'Birim güncellendi.' })
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' })
    if (res.ok) {
      loadDepartments()
      toast({ title: 'Silindi', description: 'Birim başarıyla silindi.' })
    }
  }

  const handleCheckExpiringContracts = async () => {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check-expiring' })
    })
    if (res.ok) {
      toast({ title: 'Tamamlandı', description: 'Sözleşme süreleri kontrol edildi.' })
      loadNotifications()
    }
  }

  // UI Components
  const DepartmentList = ({ departments, loading, onEdit, onDelete }: any) => (
    <div className="overflow-hidden border border-slate-50 rounded-2xl">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6">BİRİM ADI</TableHead>
            <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">E-POSTA</TableHead>
            <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SÖZLEŞME</TableHead>
            <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">İŞLEM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-400 font-bold">Yükleniyor...</TableCell></TableRow>
          ) : departments.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-400 font-bold">Birim bulunamadı.</TableCell></TableRow>
          ) : departments.map((d: any) => (
            <TableRow key={d.id} className="group hover:bg-slate-50/50 transition-all">
              <TableCell className="pl-6">
                <span className="text-sm font-black text-slate-900">{d.name}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs font-bold text-slate-500">{d.email}</span>
              </TableCell>
              <TableCell className="text-center">
                <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] rounded-lg h-6">
                  {d.contractCount || d._count?.contracts || 0} ADET
                </Badge>
              </TableCell>
              <TableCell className="text-right pr-6 space-x-1">
                <Button variant="ghost" size="icon" onClick={() => {
                  setEditingDepartment(d)
                  setNewDepartment({ name: d.name, email: d.email, description: d.description || '' })
                  setDeptShowAddDialog(true)
                }} className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(d.id)} className="h-8 w-8 text-rose-600 hover:bg-rose-50 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const SmtpList = ({ configs, onDelete, onActivate }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {configs.map((c: any) => (
        <Card key={c.id} className={cn(
          "relative overflow-hidden border-2 transition-all p-6 rounded-3xl",
          c.isActive ? "border-sky-500/20 bg-sky-50/10" : "border-slate-50 bg-white"
        )}>
          {c.isActive && (
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
              AKTİF
            </div>
          )}
          <div className="flex flex-col h-full space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl">
                <Mail className={cn("h-6 w-6", c.isActive ? "text-sky-600" : "text-slate-400")} />
              </div>
              <Badge variant="outline" className="text-[10px] font-black border-slate-100 uppercase">PORT {c.port}</Badge>
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 tracking-tight">{c.name}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{c.host}</p>
            </div>
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex gap-1.5">
                <Button variant="ghost" size="icon" onClick={() => onDelete(c.id)} className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-xl">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {!c.isActive && (
                <Button onClick={() => onActivate(c.id)} variant="ghost" className="h-9 text-[10px] font-black text-sky-600 hover:bg-sky-50 rounded-xl uppercase">
                  VARSAYILAN YAP
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  const NotificationsList = ({ notifications }: any) => (
    <div className="overflow-hidden border border-slate-50 rounded-2xl">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6">TARİH</TableHead>
            <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">KONU / SÖZLEŞME</TableHead>
            <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">BİRİM</TableHead>
            <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">DURUM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-400 font-bold">Kayıt yok.</TableCell></TableRow>
          ) : notifications.map((n: any) => (
            <TableRow key={n.id} className="group hover:bg-slate-50/50 transition-all">
              <TableCell className="pl-6">
                <span className="text-xs font-black text-slate-400 uppercase">{new Date(n.sentAt || n.createdAt).toLocaleDateString()}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900">{n.subject}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                    SÖZLEŞME: {n.contract?.subject}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs font-bold text-slate-600">{n.contract?.department?.name}</span>
              </TableCell>
              <TableCell className="text-right pr-6">
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] rounded-lg h-5 uppercase tracking-widest px-2">
                  GÖNDERİLDİ
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        {/* Header */}
        <div className="px-1">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <Settings className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-2 transition-all">Sistem Ayarları</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            SözleşmePRO Yapılandırması
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl mt-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
            Sistem genelindeki teknik yetkilendirmeleri, ağ yapılandırmalarını ve organizasyonel birimleri buradan yönetin.
          </p>
        </div>

        <Tabs defaultValue="company" className="w-full space-y-10">
          <div className="bg-slate-100/50 p-1 rounded-lg w-fit border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-700">
            <TabsList className="h-auto bg-transparent p-0 flex flex-wrap gap-1 border-none shadow-none">
              {[
                { id: 'company', label: 'ŞİRKET PROFİLİ', icon: Building2 },
                { id: 'users', label: 'KULLANICILAR', icon: Users },
                { id: 'departments', label: 'BİRİM YÖNETİMİ', icon: LayoutGrid },
                { id: 'smtp', label: 'E-POSTA (SMTP)', icon: Mail },
                { id: 'notifications', label: 'BİLDİRİM KAYITLARI', icon: Bell },
                { id: 'definitions', label: 'SİSTEM TANIMLARI', icon: ShieldCheck },
                { id: 'backup', label: 'YEDEK YÖNETİMİ', icon: Database },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="group relative data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 rounded-md px-4 py-2 flex items-center gap-2 transition-all duration-200 outline-none"
                >
                  <div className="relative p-1.5 text-slate-500 group-data-[state=active]:text-blue-600 transition-colors">
                    <tab.icon className="h-4 w-4" />
                  </div>

                  <span className="relative text-xs font-medium text-slate-500 group-data-[state=active]:text-slate-900 group-hover:text-slate-800 transition-colors">
                    {tab.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="mt-8">
            <TabsContent value="company" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-700 rounded-md border border-slate-100">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Şirket Kimliği</CardTitle>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">RESMİ BİLGİLER VE LOGO</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <CompaniesSection />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-700 rounded-md border border-slate-100">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Kullanıcı Yönetimi</CardTitle>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">YETKİ VE ERİŞİM KONTROLÜ</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <UsersSection />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-700 rounded-md border border-slate-100">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Birimler</CardTitle>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">ORGANİZASYONEL ŞEMA</p>
                    </div>
                  </div>
                  <Button onClick={() => setDeptShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md h-10 px-4 shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> YENİ BİRİM
                  </Button>
                </CardHeader>
                <CardContent className="p-8">
                  <DepartmentList departments={departments} loading={deptLoading} onDelete={handleDeleteDepartment} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="smtp" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900 tracking-tight">E-posta Servisi</CardTitle>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">BİLDİRİM SUNUCU AYARLARI</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowAddSmtpDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] tracking-widest rounded-xl h-11 px-6 uppercase shadow-lg shadow-blue-500/10">
                    <Plus className="mr-2 h-4 w-4" /> YENİ SUNUCU
                  </Button>
                </CardHeader>
                <CardContent className="p-8">
                  <SmtpList configs={smtpConfigs} onDelete={handleDeleteSmtp} onActivate={handleSetActiveSmtp} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Bildirim Geçmişi</CardTitle>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">SİSTEM MESAJLARI VE DURUMLARI</p>
                    </div>
                  </div>
                  <Button onClick={handleCheckExpiringContracts} variant="outline" className="border-slate-200 text-slate-600 font-black text-[10px] tracking-widest rounded-xl h-11 px-6 uppercase hover:bg-slate-50">
                    <History className="mr-2 h-4 w-4" /> MANUEL KONTROL
                  </Button>
                </CardHeader>
                <CardContent className="p-8">
                  <NotificationsList notifications={notifications} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="definitions" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border-none soft-elevation rounded-3xl overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Sistem Tanımları</CardTitle>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">DİNAMİK LİSTE YÖNETİMİ</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DefinitionsManager type="CONTRACT_CATEGORY" title="Sözleşme Kategorileri" description="Örn: Satın Alma, Hizmet, Gizlilik" />
                    <DefinitionsManager type="CONTRACT_TYPE" title="Sözleşme Tipleri" description="Örn: Çerçeve Sözleşme, Teklif, Protokol" />
                    <DefinitionsManager type="CURRENCY" title="Para Birimleri" description="Sistemde kullanılan döviz cinsleri" />
                    <DefinitionsManager type="PAYMENT_FREQUENCY" title="Ödeme Periyotları" description="Örn: Tek Seferlik, Aylık, Yıllık" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup" className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white border-none soft-elevation rounded-3xl overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Yedekleme ve Geri Yükleme</CardTitle>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">VERİ YÖNETİMİ VE GÜVENLİĞİ</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Export Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-800">Verileri Dışa Aktar</h3>
                      <p className="text-sm text-slate-600">Sistemdeki tüm verileri (sözleşmeler, kullanıcılar, ayarlar vb.) JSON formatında dışa aktarın. Bu yedekleme dosyası, sisteminizi başka bir ortama taşımak veya verilerinizi güvende tutmak için kullanılabilir.</p>
                      <Button onClick={handleExportData} className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-md h-10 px-4 shadow-sm">
                        <Download className="mr-2 h-4 w-4" /> VERİLERİ DIŞA AKTAR
                      </Button>
                    </div>

                    {/* Import Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-800">Verileri İçe Aktar</h3>
                      <p className="text-sm text-slate-600">Daha önce dışa aktarılmış bir JSON yedekleme dosyasını sisteme geri yükleyin. Bu işlem mevcut verilerin üzerine yazabilir veya yeni veriler ekleyebilir. Lütfen dikkatli olun.</p>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-purple-50 file:text-purple-700
                                  hover:file:bg-purple-100"
                      />
                      <Button onClick={handleImportData} disabled={!selectedFile} className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-md h-10 px-4 shadow-sm">
                        <Upload className="mr-2 h-4 w-4" /> VERİLERİ İÇE AKTAR
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={deptShowAddDialog} onOpenChange={setDeptShowAddDialog}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-lg shadow-lg">
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">{editingDepartment ? 'Birimi Düzenle' : 'Yeni Birim Kaydı'}</DialogTitle>
              <p className="text-sm font-medium text-slate-500">Yeni bir departman ekleyin veya düzenleyin.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Birim Adı</Label>
                <Input value={newDepartment.name} onChange={(e) => setNewDepartment(p => ({ ...p, name: e.target.value }))} className="bg-white border-slate-200 rounded-md h-10 text-sm font-medium text-slate-900 px-3" placeholder="Örn: Hukuk Müşavirliği" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Birim E-postası</Label>
                <Input value={newDepartment.email} onChange={(e) => setNewDepartment(p => ({ ...p, email: e.target.value }))} className="bg-white border-slate-200 rounded-md h-10 text-sm font-medium text-slate-900 px-3" placeholder="hukuk@sirket.com" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeptShowAddDialog(false)} className="h-10 rounded-md font-medium text-sm border-slate-200 text-slate-600">İptal</Button>
              <Button onClick={editingDepartment ? handleUpdateDepartment : handleAddDepartment} className="h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm">Kaydet</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddSmtpDialog} onOpenChange={setShowAddSmtpDialog}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-lg shadow-lg border-slate-200">
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">SMTP Yapılandırması</DialogTitle>
              <p className="text-sm font-medium text-slate-500">E-posta sunucunuzu yapılandırın.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">BAŞLIK / ETİKET</Label>
                <Input value={newSmtp.name} onChange={(e) => setNewSmtp(p => ({ ...p, name: e.target.value }))} className="bg-white border-slate-200 rounded-md h-10 text-sm font-medium px-3 border" placeholder="Kurumsal Gmail" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">SUNUCU ADRESİ</Label>
                <Input value={newSmtp.host} onChange={(e) => setNewSmtp(p => ({ ...p, host: e.target.value }))} className="bg-white border-slate-200 rounded-md h-10 text-sm font-medium px-3 border" placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">PORT</Label>
                <Input type="number" value={newSmtp.port} onChange={(e) => setNewSmtp(p => ({ ...p, port: parseInt(e.target.value) }))} className="bg-white border-slate-200 rounded-md h-10 text-sm font-medium px-3 border" placeholder="587" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">KULLANICI ADI</Label>
                <Input value={newSmtp.username} onChange={(e) => setNewSmtp(p => ({ ...p, username: e.target.value }))} className="bg-white border-slate-200 rounded-md h-10 text-sm font-medium px-3 border" placeholder="info@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">ŞİFRE</Label>
                <Input type="password" value={newSmtp.password} onChange={(e) => setNewSmtp(p => ({ ...p, password: e.target.value }))} className="bg-white border-slate-200 rounded-md h-10 text-sm font-medium px-3 border" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">GÖNDEREN E-POSTA</Label>
                <Input value={newSmtp.fromEmail} onChange={(e) => setNewSmtp(p => ({ ...p, fromEmail: e.target.value }))} className="bg-white border-slate-200 rounded-md h-10 text-sm font-medium px-3 border" placeholder="noreply@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">GÖNDEREN ADI</Label>
                <Input value={newSmtp.fromName} onChange={(e) => setNewSmtp(p => ({ ...p, fromName: e.target.value }))} className="bg-white border-slate-200 rounded-md h-10 text-sm font-medium px-3 border" placeholder="SözleşmePRO" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddSmtpDialog(false)} className="h-10 rounded-md font-medium text-sm border-slate-200 text-slate-600">İptal</Button>
              <Button onClick={handleAddSmtp} className="h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm">Kaydet</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  )
}