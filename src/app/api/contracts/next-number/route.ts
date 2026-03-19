import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse, withCommonMiddleware } from '@/lib/apiUtils'

async function handler(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
        return ApiResponse.validationError([{ field: 'companyId', message: 'Company ID is required' }])
    }

    try {
        const company = await db.company.findUnique({
            where: { id: companyId }
        })

        if (!company) {
            return ApiResponse.notFound('Company not found')
        }

        const year = new Date().getFullYear()
        const prefix = company.prefix

        const startOfYear = new Date(year, 0, 1)
        const endOfYear = new Date(year, 11, 31, 23, 59, 59)

        const count = await db.contract.count({
            where: {
                companyId,
                createdAt: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            }
        })

        const sequence = String(count + 1).padStart(3, '0')
        const nextNumber = `${prefix}-${year}-${sequence}`

        return ApiResponse.success({ nextNumber })
    } catch (error) {
        return ApiResponse.internalError('Failed to generate contract number')
    }
}

export const GET = withCommonMiddleware(handler)
