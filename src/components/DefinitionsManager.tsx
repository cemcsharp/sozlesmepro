
"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useCompany } from "@/context/CompanyContext"

interface Definition {
    id: string
    name: string
    code?: string
    isActive: boolean
    type: string
}

interface DefinitionsManagerProps {
    type: "CONTRACT_CATEGORY" | "CONTRACT_TYPE" | "CURRENCY" | "PAYMENT_FREQUENCY"
    title: string
    description: string
}

export function DefinitionsManager({ type, title, description }: DefinitionsManagerProps) {
    const { selectedCompany } = useCompany()
    const { toast } = useToast()
    const [definitions, setDefinitions] = useState<Definition[]>([])
    const [loading, setLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentDef, setCurrentDef] = useState<Partial<Definition>>({})
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        if (selectedCompany?.id) {
            loadDefinitions()
        }
    }, [selectedCompany?.id, type])

    const loadDefinitions = async () => {
        if (!selectedCompany?.id) return
        setLoading(true)
        try {
            const res = await fetch(`/api/definitions?companyId=${selectedCompany.id}&type=${type}`)
            if (res.ok) {
                const json = await res.json()
                if (json.success) {
                    setDefinitions(json.data)
                }
            }
        } catch (error) {
            console.error("Failed to load definitions", error)
            toast({
                title: "Hata",
                description: "Tanımlar yüklenirken bir hata oluştu.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!selectedCompany?.id || !currentDef.name) {
            toast({
                title: "Eksik Bilgi",
                description: "Lütfen isim alanını doldurun.",
                variant: "destructive"
            })
            return
        }

        try {
            const url = "/api/definitions" + (isEditing ? `?id=${currentDef.id}` : "")
            const method = isEditing ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...currentDef,
                    companyId: selectedCompany.id,
                    type
                })
            })

            if (res.ok) {
                toast({
                    title: "Başarılı",
                    description: isEditing ? "Tanım güncellendi." : "Yeni tanım eklendi.",
                })
                loadDefinitions()
                setIsDialogOpen(false)
                setCurrentDef({})
                setIsEditing(false)
            } else {
                throw new Error("Failed to save")
            }
        } catch (error) {
            toast({
                title: "Hata",
                description: "Kayıt sırasında bir hata oluştu.",
                variant: "destructive"
            })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Bu tanımı silmek istediğinize emin misiniz?")) return

        try {
            const res = await fetch(`/api/definitions?id=${id}`, {
                method: "DELETE"
            })

            if (res.ok) {
                toast({
                    title: "Silindi",
                    description: "Tanım başarıyla silindi.",
                })
                loadDefinitions()
            } else {
                const json = await res.json()
                toast({
                    title: "Hata",
                    description: json.message || "Silme işlemi başarısız.",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Hata",
                description: "Silme işlemi sırasında bir hata oluştu.",
                variant: "destructive"
            })
        }
    }

    const openNewDialog = () => {
        setCurrentDef({ isActive: true, name: "", code: "" })
        setIsEditing(false)
        setIsDialogOpen(true)
    }

    const openEditDialog = (def: Definition) => {
        setCurrentDef(def)
        setIsEditing(true)
        setIsDialogOpen(true)
    }

    const toggleActive = async (def: Definition) => {
        try {
            const res = await fetch(`/api/definitions?id=${def.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isActive: !def.isActive
                })
            })

            if (res.ok) {
                loadDefinitions()
            }
        } catch (error) {
            toast({
                title: "Hata",
                description: "Güncelleme başarısız.",
                variant: "destructive"
            })
        }
    }

    return (
        <Card className="card-modern">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewDialog} size="sm" className="btn-primary-modern">
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{isEditing ? "Tanımı Düzenle" : "Yeni Tanım Ekle"}</DialogTitle>
                            <DialogDescription>
                                {title} listesine yeni bir seçenek ekleyin.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    İsim
                                </Label>
                                <Input
                                    id="name"
                                    value={currentDef.name || ""}
                                    onChange={(e) => setCurrentDef({ ...currentDef, name: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Örn: Yıllık Bakım"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="code" className="text-right">
                                    Kısa Kod (Ops.)
                                </Label>
                                <Input
                                    id="code"
                                    value={currentDef.code || ""}
                                    onChange={(e) => setCurrentDef({ ...currentDef, code: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Örn: YILLIK"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="active" className="text-right">
                                    Aktif
                                </Label>
                                <Switch
                                    id="active"
                                    checked={currentDef.isActive}
                                    onCheckedChange={(checked) => setCurrentDef({ ...currentDef, isActive: checked })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave} type="submit">{isEditing ? "Güncelle" : "Kaydet"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>İsim</TableHead>
                                <TableHead>Kısa Kod</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : definitions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        Henüz kayıt bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                definitions.map((def) => (
                                    <TableRow key={def.id}>
                                        <TableCell className="font-medium">{def.name}</TableCell>
                                        <TableCell>{def.code || "-"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    checked={def.isActive}
                                                    onCheckedChange={() => toggleActive(def)}
                                                />
                                                <span className="text-xs text-muted-foreground">{def.isActive ? "Aktif" : "Pasif"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(def)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(def.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
