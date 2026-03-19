"use client"

import { useCompany } from '@/context/CompanyContext'
import { useState, useEffect } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Building2, PlusCircle, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CompanySwitcher() {
    const { companies, selectedCompany, selectCompany, isLoading } = useCompany()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || isLoading) {
        return <div className="h-9 w-40 bg-slate-800 animate-pulse rounded-md" />
    }

    if (companies.length === 0) {
        return (
            <div className="flex items-center text-white/80 text-sm">
                <Building2 className="h-4 w-4 mr-2" />
                <span>Şirket Bulunamadı</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Select
                value={selectedCompany?.id}
                onValueChange={(value) => {
                    if (value === 'manage') {
                        router.push('/settings')
                    } else {
                        selectCompany(value)
                        // Optional: Reload to refresh data if context isn't enough for some parts
                        window.location.reload()
                    }
                }}
            >
                <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white hover:bg-slate-700 transition-colors focus:ring-0 focus:ring-offset-0 h-9 rounded-md">
                    <div className="flex items-center gap-2 truncate text-xs">
                        <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span className="truncate font-semibold">{selectedCompany?.name || 'Şirket Seç'}</span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{company.name}</span>
                                <span className="text-xs text-muted-foreground">({company.prefix})</span>
                            </div>
                        </SelectItem>
                    ))}
                    <div className="p-1 border-t mt-1">
                        <div
                            className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-slate-100 rounded-sm"
                            onClick={(e) => {
                                e.preventDefault()
                                router.push('/settings')
                            }}
                        >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            Manage Companies
                        </div>
                    </div>
                </SelectContent>
            </Select>
        </div>
    )
}
