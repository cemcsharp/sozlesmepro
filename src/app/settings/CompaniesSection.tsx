"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Settings, Plus, Edit, Trash2, Building2, Users, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCompany } from '@/context/CompanyContext'

interface Company {
    id: string
    name: string
    prefix: string
    email?: string
    phone?: string
    website?: string
    taxNumber?: string
    address?: string
    createdAt: string
    _count?: {
        contracts: number
        users: number
        departments: number
    }
}

export function CompaniesSection() {
    const { toast } = useToast()
    const { refreshCompanies } = useCompany()
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [showDialog, setShowDialog] = useState(false)
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)
    const [form, setForm] = useState({
        name: '',
        prefix: '',
        email: '',
        phone: '',
        website: '',
        taxNumber: '',
        address: ''
    })

    useEffect(() => {
        loadCompanies()
    }, [])

    const loadCompanies = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/companies')
            if (!res.ok) throw new Error('Şirketler alınamadı')
            const json = await res.json()
            setCompanies(json.data || [])
        } catch (e) {
            toast({ title: 'Hata', description: 'Şirketler yüklenemedi', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.prefix.trim()) {
            toast({ title: 'Eksik Bilgi', description: 'Şirket adı ve Kısaltma kodu (Prefix) zorunludur', variant: 'destructive' })
            return
        }

        try {
            const url = '/api/companies'
            const method = editingCompany ? 'PUT' : 'POST'
            const body = editingCompany ? { ...form, id: editingCompany.id } : form

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.message || 'İşlem başarısız')
            }

            toast({ title: 'Başarılı', description: editingCompany ? 'Şirket güncellendi' : 'Şirket oluşturuldu' })
            setShowDialog(false)
            resetForm()
            loadCompanies()
            refreshCompanies()
        } catch (e: any) {
            toast({ title: 'Hata', description: e.message, variant: 'destructive' })
        }
    }

    const handleEdit = (company: Company) => {
        setEditingCompany(company)
        setForm({
            name: company.name,
            prefix: company.prefix,
            email: company.email || '',
            phone: company.phone || '',
            website: company.website || '',
            taxNumber: company.taxNumber || '',
            address: company.address || ''
        })
        setShowDialog(true)
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${name} şirketini silmek istediğinize emin misiniz?`)) return

        try {
            const res = await fetch(`/api/companies?id=${id}`, { method: 'DELETE' })
            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.message || 'Silme işlemi başarısız')
            }

            toast({ title: 'Başarılı', description: 'Şirket silindi' })
            loadCompanies()
            refreshCompanies()
        } catch (e: any) {
            toast({ title: 'Hata', description: e.message, variant: 'destructive' })
        }
    }

    const resetForm = () => {
        setEditingCompany(null)
        setForm({
            name: '',
            prefix: '',
            email: '',
            phone: '',
            website: '',
            taxNumber: '',
            address: ''
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight gradient-text">Şirket Yönetimi</h2>
                    <p className="text-muted-foreground">Holding bünyesindeki şirketleri ve kısaltma kodlarını yönetin</p>
                </div>
                <Dialog open={showDialog} onOpenChange={(open) => {
                    setShowDialog(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button className="btn-primary-modern">
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Şirket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingCompany ? 'Şirketi Düzenle' : 'Yeni Şirket Ekle'}</DialogTitle>
                            <DialogDescription>
                                Şirket bilgileri ve sözleşme numaralarında kullanılacak BENZERSİZ prefix kodu.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Şirket Adı *</Label>
                                <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Acme A.Ş." className="input-modern" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="prefix">Kısaltma Kodu (Prefix) *</Label>
                                <Input id="prefix" value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value.toUpperCase() })} placeholder="ACM" maxLength={5} className="input-modern uppercase" />
                                <p className="text-xs text-muted-foreground">Örn: CEM, CMT (Sözleşme No: CEM-2024-001)</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax">Vergi No</Label>
                                <Input id="tax" value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} className="input-modern" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta</Label>
                                <Input id="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-modern" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-modern" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Web Sitesi</Label>
                                <Input id="website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="input-modern" />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="address">Adres</Label>
                                <Input id="address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-modern" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowDialog(false)}>İptal</Button>
                            <Button onClick={handleSubmit} className="btn-primary-modern">{editingCompany ? 'Güncelle' : 'Kaydet'}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="card-modern">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Şirket</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{companies.length}</div>
                    </CardContent>
                </Card>
                <Card className="card-modern">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Sözleşme</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {companies.reduce((acc, curr) => acc + (curr._count?.contracts || 0), 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-modern">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Kullanıcı</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {companies.reduce((acc, curr) => acc + (curr._count?.users || 0), 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="card-modern">
                <CardHeader>
                    <CardTitle>Şirket Listesi</CardTitle>
                    <CardDescription>Sözleşmeleri yönetilen şirketler</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Şirket Adı</TableHead>
                                <TableHead>Kısaltma (Prefix)</TableHead>
                                <TableHead>İletişim</TableHead>
                                <TableHead>Sözleşme Sayısı</TableHead>
                                <TableHead className="w-[100px]">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : companies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">Henüz şirket eklenmemiş.</TableCell>
                                </TableRow>
                            ) : (
                                companies.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">
                                            {company.name}
                                            {company.taxNumber && <div className="text-xs text-muted-foreground">VN: {company.taxNumber}</div>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-base">{company.prefix}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{company.phone}</div>
                                            <div className="text-xs text-muted-foreground">{company.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{company._count?.contracts || 0} Sözleşme</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(company)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Düzenle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(company.id, company.name)} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
