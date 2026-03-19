"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  FileText,
  Settings,
  Menu,
  X,
  BarChart3,
  Database,
  Building2
} from 'lucide-react'
import { CompanySwitcher } from './CompanySwitcher'

const navigation = [
  { name: 'Ana Sayfa', href: '/', icon: Home },
  { name: 'Sözleşmeler', href: '/contracts', icon: FileText },
  { name: 'Yeni Sözleşme', href: '/contracts/create', icon: Database },
  { name: 'Ayarlar', href: '/settings', icon: Settings },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const search = useSearchParams()
  const isPublic = search.get('public') === '1'
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)

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
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (!res.ok) {
        // ignore and continue
      }
    } catch { }
    router.replace('/login')
  }

  const hideOnLogin = pathname?.startsWith('/login')

  if (isPublic || hideOnLogin) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18">
          <div className="flex items-center">
            {/* Logo and Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" prefetch={false} className="flex items-center space-x-3 group">
                <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">Sözleşme<span className="text-blue-600">PRO</span></h1>
                  <p className="text-[10px] uppercase tracking-widest font-medium text-slate-500">Yönetim Paneli</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-1">
              {navigation.filter((item) => item.href !== '/settings' ? true : user?.role === 'ADMIN').map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <Icon className={cn("h-4 w-4 mr-2", isActive ? "text-blue-600" : "text-slate-400")} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center ml-4 mr-4">
              <CompanySwitcher />
            </div>

            <div className="hidden sm:flex items-center gap-6 border-l border-slate-200 pl-6">
              {user && (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Kullanıcı</span>
                  <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                Çıkış Yap
              </Button>
            </div>
            <div className="sm:hidden flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-top duration-300">
          {user && (
            <div className="px-5 py-4 bg-slate-50/50">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Hesap</p>
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
            </div>
          )}
          <div className="pt-2 pb-6 space-y-1">
            {navigation.filter((item) => item.href !== '/settings' ? true : user?.role === 'ADMIN').map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    'flex items-center pl-4 pr-4 py-3 text-base font-medium transition-colors duration-200 mx-2 rounded-md',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-blue-600" : "text-slate-400")} />
                  {item.name}
                </Link>
              )
            })}
            <div className="px-4 pt-4 border-t border-slate-100 mt-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                className="w-full text-slate-600 hover:text-red-600 hover:bg-red-50 justify-start"
              >
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}