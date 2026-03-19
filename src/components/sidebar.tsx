"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Home,
    FileText,
    Settings,
    Database,
    Plus,
    LogOut,
    ChevronRight,
    User,
    LayoutGrid,
    Menu,
    X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CompanySwitcher } from './CompanySwitcher'

const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Sözleşmeler', href: '/contracts', icon: FileText },
    { name: 'Yeni Sözleşme', href: '/contracts/create', icon: Database },
    { name: 'Ayarlar', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<{ name: string; role: string } | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const loadUser = async () => {
            try {
                const res = await fetch('/api/auth/me', { cache: 'no-store' })
                if (!res.ok) return
                const json = await res.json()
                const data = json?.data
                if (data) setUser({ name: data.name || data.email, role: data.role })
            } catch { }
        }
        loadUser()
    }, [])

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
        } catch { }
        window.location.href = '/login'
    }

    const isLoginPage = pathname?.startsWith('/login')
    if (isLoginPage) return null

    const NavItem = ({ item }: { item: typeof navigation[0] }) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))

        if (item.href === '/settings' && user?.role !== 'ADMIN') return null

        return (
            <Link
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                    "group flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-md mb-0.5 relative",
                    isActive
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
            >
                <Icon className={cn("h-5 w-5 mr-3 transition-transform duration-300 group-hover:scale-110", isActive ? "text-blue-400" : "text-slate-500")} />
                <span className="flex-1 tracking-tight">{item.name}</span>
                {isActive && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </Link>
        )
    }

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar/95 backdrop-blur-xl border-b border-sidebar-border z-40 px-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-sidebar-foreground tracking-tight">Sözleşme<span className="text-blue-600">PRO</span></span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="rounded-xl hover:bg-sidebar-accent text-sidebar-foreground">
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Main Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transition-all duration-500 ease-in-out lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full bg-sidebar">

                    {/* Logo Section */}
                    <div className="px-8 py-10">
                        <div className="flex items-center space-x-3 group cursor-pointer">
                            <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">Sözleşme<span className="text-blue-600">PRO</span></h1>
                                <span className="text-[9px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">Yönetim Paneli</span>
                            </div>
                        </div>
                    </div>

                    {/* Company Switcher */}
                    <div className="px-6 mb-8">
                        <div className="bg-slate-800/40 rounded-md p-3 border border-slate-800">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">ORGANİZASYON</span>
                            <CompanySwitcher />
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto custom-scrollbar">
                        {navigation.map((item) => (
                            <NavItem key={item.name} item={item} />
                        ))}
                    </nav>

                    {/* Footer User Profile */}
                    <div className="p-6 mt-auto">
                        <Link
                            href="/profile"
                            className="bg-slate-800/40 rounded-md p-3 border border-slate-800 flex items-center gap-3 transition-colors hover:bg-slate-800/60"
                        >
                            <div className="w-9 h-9 rounded-md bg-slate-800 border border-slate-800 flex items-center justify-center">
                                <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate tracking-tight">{user?.name || 'Yükleniyor...'}</p>
                                <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest truncate">{user?.role === 'ADMIN' ? 'YÖNETİCİ' : 'PERSONEL'}</p>
                            </div>
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleLogout();
                                }}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover/profile:opacity-100 transition-all"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    )
}
