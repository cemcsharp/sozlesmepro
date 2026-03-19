"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname?.startsWith('/login')

    return (
        <main className={cn(
            "flex-1 min-h-screen transition-all duration-500",
            !isLoginPage && "lg:pl-72 pt-16 lg:pt-0"
        )}>
            {children}
        </main>
    )
}
