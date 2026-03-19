import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse, withCommonMiddleware } from '@/lib/apiUtils'
import { getSession } from '@/lib/auth'

async function handler(request: NextRequest) {
    try {
        const user = await getSession(request)
        if (!user || user.role !== 'ADMIN') {
            return ApiResponse.forbidden('Sadece yöneticiler yedek alabilir')
        }

        // Fetch all data from tables
        const [
            companies,
            departments,
            definitions,
            contracts,
            users,
            smtpConfigs,
            notifications
        ] = await Promise.all([
            db.company.findMany(),
            db.department.findMany(),
            db.contractDefinition.findMany(),
            db.contract.findMany({
                include: {
                    documents: true,
                    versions: true,
                    changeLogs: true
                }
            }),
            db.user.findMany({
                include: {
                    companies: true
                }
            }),
            db.smtpConfig.findMany(),
            db.notification.findMany()
        ])

        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                companies,
                departments,
                definitions,
                contracts,
                users,
                smtpConfigs,
                notifications
            }
        }

        return ApiResponse.success(backupData, 'Yedek başarıyla oluşturuldu')
    } catch (error) {
        console.error('Backup Export Error:', error)
        return ApiResponse.internalError('Yedek oluşturulamadı')
    }
}

export const GET = withCommonMiddleware(handler)
