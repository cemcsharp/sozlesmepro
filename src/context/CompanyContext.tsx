"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Company {
    id: string
    name: string
    prefix: string
    logoUrl?: string
}

interface CompanyContextType {
    companies: Company[]
    selectedCompany: Company | null
    isLoading: boolean
    selectCompany: (companyId: string) => void
    refreshCompanies: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
    const [companies, setCompanies] = useState<Company[]>([])
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/companies', { cache: 'no-store' })
            if (res.ok) {
                const json = await res.json()
                if (json.success && Array.isArray(json.data)) {
                    setCompanies(json.data)
                    return json.data as Company[]
                }
            }
        } catch (error) {
            console.error('Failed to fetch companies', error)
        }
        return []
    }

    useEffect(() => {
        const init = async () => {
            setIsLoading(true)
            const fetchedCompanies = await fetchCompanies()

            // Load saved selection from local storage
            const savedCompanyId = localStorage.getItem('selectedCompanyId')

            if (fetchedCompanies.length > 0) {
                if (savedCompanyId) {
                    const found = fetchedCompanies.find(c => c.id === savedCompanyId)
                    if (found) {
                        setSelectedCompany(found)
                    } else {
                        // Saved company not found (maybe deleted), select first
                        setSelectedCompany(fetchedCompanies[0])
                        localStorage.setItem('selectedCompanyId', fetchedCompanies[0].id)
                    }
                } else {
                    // No saved preference, select first
                    setSelectedCompany(fetchedCompanies[0])
                    localStorage.setItem('selectedCompanyId', fetchedCompanies[0].id)
                }
            } else {
                setSelectedCompany(null)
            }

            setIsLoading(false)
        }

        init()
    }, [])

    const selectCompany = (companyId: string) => {
        const company = companies.find(c => c.id === companyId)
        if (company) {
            setSelectedCompany(company)
            localStorage.setItem('selectedCompanyId', companyId)
            // Optional: Force a hard refresh if needed to clear other states
            // window.location.reload() 
        }
    }

    const refreshCompanies = async () => {
        const fetchedCompanies = await fetchCompanies()
        // If currently selected company was deleted, handle it
        if (selectedCompany && !fetchedCompanies.find(c => c.id === selectedCompany.id)) {
            if (fetchedCompanies.length > 0) {
                setSelectedCompany(fetchedCompanies[0])
                localStorage.setItem('selectedCompanyId', fetchedCompanies[0].id)
            } else {
                setSelectedCompany(null)
                localStorage.removeItem('selectedCompanyId')
            }
        } else if (!selectedCompany && fetchedCompanies.length > 0) {
            // If no company was selected but now we have one
            setSelectedCompany(fetchedCompanies[0])
            localStorage.setItem('selectedCompanyId', fetchedCompanies[0].id)
        }
    }

    return (
        <CompanyContext.Provider value={{
            companies,
            selectedCompany,
            isLoading,
            selectCompany,
            refreshCompanies
        }}>
            {children}
        </CompanyContext.Provider>
    )
}

export function useCompany() {
    const context = useContext(CompanyContext)
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider')
    }
    return context
}
