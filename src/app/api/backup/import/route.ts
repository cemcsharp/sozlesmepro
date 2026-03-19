import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse, withCommonMiddleware, parseRequestBody } from '@/lib/apiUtils'
import { getSession } from '@/lib/auth'

async function handler(request: NextRequest) {
    try {
        const user = await getSession(request)
        if (!user || user.role !== 'ADMIN') {
            return ApiResponse.forbidden('Sadece yöneticiler yedek yükleyebilir')
        }

        const payload = await parseRequestBody(request)
        const { data } = payload

        if (!data || !data.companies) {
            return ApiResponse.error(new Error('Geçersiz yedek dosyası'), 400)
        }

        // Atomic transaction for restore
        await db.$transaction(async (tx) => {
            // Order is important due to foreign key constraints
            // Clear existing data
            await tx.notification.deleteMany()
            await tx.contractChangeLog.deleteMany()
            await tx.contractVersion.deleteMany()
            await tx.contractDocument.deleteMany()
            await tx.contract.deleteMany()
            await tx.department.deleteMany()
            await tx.contractDefinition.deleteMany()
            await tx.smtpConfig.deleteMany()
            await tx.company.deleteMany() // Company must be deleted last or after contracts/depts

            // 1. Restore Companies (First because others depend on it)
            for (const comp of data.companies) {
                await tx.company.create({ data: comp })
            }

            // 2. Restore Definitions
            if (data.definitions) {
                for (const def of data.definitions) {
                    await tx.contractDefinition.create({ data: def })
                }
            }

            // 3. Restore Departments
            for (const dept of data.departments) {
                await tx.department.create({ data: dept })
            }

            // 4. Restore Contracts
            for (const contract of data.contracts) {
                const { documents, versions, changeLogs, ...contractData } = contract
                await tx.contract.create({ data: contractData })

                // Restore documents
                if (documents && documents.length > 0) {
                    await tx.contractDocument.createMany({ data: documents })
                }

                // Restore versions
                if (versions && versions.length > 0) {
                    await tx.contractVersion.createMany({ data: versions })
                }

                // Restore changelogs
                if (changeLogs && changeLogs.length > 0) {
                    await tx.contractChangeLog.createMany({ data: changeLogs })
                }
            }

            // 5. Restore Users & Associations
            for (const u of data.users) {
                const { companies: userCompanies, ...userData } = u

                const existing = await tx.user.findUnique({ where: { email: u.email } })
                if (existing) {
                    await tx.user.update({
                        where: { email: u.email },
                        data: {
                            ...userData,
                            companies: {
                                set: userCompanies?.map((c: any) => ({ id: c.id })) || []
                            }
                        }
                    })
                } else {
                    await tx.user.create({
                        data: {
                            ...userData,
                            companies: {
                                connect: userCompanies?.map((c: any) => ({ id: c.id })) || []
                            }
                        }
                    })
                }
            }

            // 6. Restore SMTP
            if (data.smtpConfigs) {
                for (const smtp of data.smtpConfigs) {
                    await tx.smtpConfig.create({ data: smtp })
                }
            }

            // 7. Restore Notifications
            if (data.notifications) {
                await tx.notification.createMany({ data: data.notifications })
            }
        })

        return ApiResponse.success(null, 'Yedek başarıyla yüklendi. Değişiklerin etkili olması için sayfayı yenileyin.')
    } catch (error: any) {
        console.error('Backup Import Error:', error)
        return ApiResponse.error(new Error(`Yedek yüklenemedi: ${error.message}`), 500)
    }
}

export const POST = withCommonMiddleware(handler)
