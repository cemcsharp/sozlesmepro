import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse, withCommonMiddleware } from '@/lib/apiUtils'
import { getSession } from '@/lib/auth'

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    const user = await getSession(request)
    if (!user) return ApiResponse.unauthorized()

    // Enforce multi-tenancy: Verify if user has access to this company
    if (user.role !== 'ADMIN') {
      if (!companyId) {
        return ApiResponse.success({
          stats: { totalContracts: 0, activeContracts: 0, expiredContracts: 0, expiringIn30Days: 0, expiringIn15Days: 0, expiringIn7Days: 0, expiringIn1Day: 0 },
          contracts: []
        })
      }

      const association = await db.user.findFirst({
        where: { id: user.id, companies: { some: { id: companyId } } }
      })
      if (!association) return ApiResponse.forbidden('Bu şirket için yetkiniz yok')
    }

    // After security check, ensure companyId is valid if provided
    if (!companyId) {
      return ApiResponse.success({
        stats: { totalContracts: 0, activeContracts: 0, expiredContracts: 0, expiringIn30Days: 0, expiringIn15Days: 0, expiringIn7Days: 0, expiringIn1Day: 0 },
        contracts: []
      })
    }

    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Get total contracts count
    const totalContracts = await db.contract.count({
      where: { companyId }
    })

    // Get active contracts count
    const activeContracts = await db.contract.count({
      where: {
        status: 'ACTIVE',
        companyId
      }
    })

    // Get expired contracts count
    const expiredContracts = await db.contract.count({
      where: {
        companyId,
        OR: [
          { status: 'EXPIRED' },
          {
            endDate: {
              lt: today
            }
          }
        ]
      }
    })

    // Get contracts expiring in specific timeframes
    const expiringContracts = await db.contract.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        subject: true,
        contractNumber: true,
        department: {
          select: {
            name: true,
            email: true
          }
        },
        amount: true,
        currency: {
          select: { name: true, code: true }
        }
      }
    })

    // Calculate contracts expiring in specific days
    const expiringIn30Days = expiringContracts.filter(contract => {
      const daysUntilExpiry = Math.ceil((new Date(contract.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    }).length

    const expiringIn15Days = expiringContracts.filter(contract => {
      const daysUntilExpiry = Math.ceil((new Date(contract.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 15 && daysUntilExpiry > 0
    }).length

    const expiringIn7Days = expiringContracts.filter(contract => {
      const daysUntilExpiry = Math.ceil((new Date(contract.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0
    }).length

    const expiringIn1Day = expiringContracts.filter(contract => {
      const daysUntilExpiry = Math.ceil((new Date(contract.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 1 && daysUntilExpiry > 0
    }).length

    // Format contracts for display
    const formattedContracts = expiringContracts.map(contract => {
      const daysUntilExpiry = Math.ceil((new Date(contract.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: contract.id,
        contractNumber: contract.contractNumber,
        subject: contract.subject,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate.toISOString(),
        department: contract.department?.name || 'Bilinmiyor',
        amount: contract.amount,
        currency: contract.currency?.code || contract.currency?.name || 'TRY',
        daysUntilExpiry
      }
    }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

    const stats = {
      totalContracts,
      activeContracts,
      expiredContracts,
      expiringIn30Days,
      expiringIn15Days,
      expiringIn7Days,
      expiringIn1Day
    }

    return ApiResponse.success({ stats, contracts: formattedContracts })

  } catch (error) {
    console.error('Dashboard API Error:', error)
    return ApiResponse.internalError('Dashboard verisi alınamadı')
  }
}

export const GET = withCommonMiddleware(handler)