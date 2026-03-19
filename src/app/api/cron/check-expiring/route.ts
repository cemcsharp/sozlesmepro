import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse } from '@/lib/apiUtils'
import { sendEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
    try {
        const today = new Date()

        // Find contracts expiring in the next 30 days
        const thirtyDaysFromNow = new Date(today)
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        const expiringContracts = await db.contract.findMany({
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: today,
                    lte: thirtyDaysFromNow
                }
            },
            include: {
                department: true,
                company: true,
                category: true,
                type: true,
                notifications: {
                    where: { isSent: false }
                }
            }
        })

        const results: Array<{ contractId: string; contractNumber: string; emailSent: boolean; daysLeft: number }> = []

        for (const contract of expiringContracts) {
            const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            // Check if we need to send a notification for this threshold
            const thresholds = [30, 15, 7, 1]
            const matchingThreshold = thresholds.find(t => daysLeft <= t)

            if (!matchingThreshold) continue

            // Check if a notification for this threshold was already sent
            const alreadySent = await db.notification.findFirst({
                where: {
                    contractId: contract.id,
                    daysBefore: matchingThreshold,
                    isSent: true
                }
            })

            if (alreadySent) continue

            // Send email to department
            let emailSent = false
            const departmentEmail = contract.department?.email
            if (departmentEmail) {
                try {
                    const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contracts/view/${contract.id}`
                    await sendEmail({
                        to: departmentEmail,
                        subject: `⚠️ Sözleşme Süresi Doluyor: ${contract.contractNumber}`,
                        html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #dc2626;">⚠️ Sözleşme Süre Uyarısı</h2>
                <p>Merhaba,</p>
                <p>Aşağıdaki sözleşmenin süresinin dolmasına <strong>${daysLeft} gün</strong> kalmıştır:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Sözleşme No:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${contract.contractNumber}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Konu:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${contract.subject}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Firma:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${contract.company?.name || '---'}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Bitiş Tarihi:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${contract.endDate.toLocaleDateString('tr-TR')}</td></tr>
                </table>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${link}" style="padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Sözleşmeyi İncele</a>
                </div>
                <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">Bu e-posta SozlesmePRO tarafından otomatik olarak gönderilmiştir.</p>
              </div>
            `
                    })
                    emailSent = true
                } catch (e) {
                    console.error(`Failed to send expiry email for ${contract.contractNumber}:`, e)
                }
            }

            // Mark notification as sent or create+mark if it doesn't exist
            const existingNotification = contract.notifications.find(n => n.daysBefore === matchingThreshold)
            if (existingNotification) {
                await db.notification.update({
                    where: { id: existingNotification.id },
                    data: { isSent: true, sentAt: new Date() }
                })
            } else {
                await db.notification.create({
                    data: {
                        contractId: contract.id,
                        type: 'EXPIRATION_WARNING',
                        daysBefore: matchingThreshold,
                        subject: `Sözleşme Uyarısı: ${contract.subject}`,
                        message: `${contract.subject} sözleşmesi ${daysLeft} gün içinde sona erecek.`,
                        isSent: true,
                        sentAt: new Date()
                    }
                })
            }

            results.push({
                contractId: contract.id,
                contractNumber: contract.contractNumber,
                emailSent,
                daysLeft
            })
        }

        return ApiResponse.success({
            checked: expiringContracts.length,
            notified: results.length,
            details: results
        })
    } catch (error) {
        console.error('Expiration check failed:', error)
        return ApiResponse.internalError('Sona erme kontrolü başarısız')
    }
}
