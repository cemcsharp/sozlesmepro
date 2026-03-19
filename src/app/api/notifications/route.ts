import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse, withCommonMiddleware } from '@/lib/apiUtils'
import nodemailer from 'nodemailer'

function buildEmailHtml(subject: string, message: string, contract: any) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const endDate = contract?.endDate ? new Date(contract.endDate) : undefined
  const days = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : undefined
  const deptName = contract?.department?.name || ''
  const deptEmail = contract?.department?.email || ''
  const viewUrl = contract?.id ? `${baseUrl}/contracts/view/${contract.id}?public=1` : baseUrl
  const remaining = days !== undefined ? `${days} gün` : ''
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head><body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f7fb;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(15,23,42,0.08);overflow:hidden;">
          <tr>
            <td style="background:#1e3a8a;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:700;">
              SözleşmePRO - Sözleşme Takip Yönetim Sistemi
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">${subject}</h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#334155;">${message}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:8px 0 16px 0;">
                <tr style="background:#f8fafc;">
                  <td style="padding:12px 16px;font-size:12px;color:#475569;width:160px;">Sözleşme</td>
                  <td style="padding:12px 16px;font-size:12px;color:#0f172a;">${contract?.subject || ''}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:12px;color:#475569;width:160px;">Sözleşme No</td>
                  <td style="padding:12px 16px;font-size:12px;color:#0f172a;">${contract?.contractNumber || ''}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:12px 16px;font-size:12px;color:#475569;width:160px;">Birim</td>
                  <td style="padding:12px 16px;font-size:12px;color:#0f172a;">${deptName}${deptEmail ? ` • ${deptEmail}` : ''}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:12px;color:#475569;width:160px;">Bitiş Tarihi</td>
                  <td style="padding:12px 16px;font-size:12px;color:#0f172a;">${endDate ? endDate.toLocaleDateString('tr-TR') : ''}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:12px 16px;font-size:12px;color:#475569;width:160px;">Kalan Süre</td>
                  <td style="padding:12px 16px;font-size:12px;color:#0f172a;">${remaining}</td>
                </tr>
              </table>
              <div style="margin-top:16px;">
                <a href="${viewUrl}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;">Sözleşmeyi Görüntüle</a>
              </div>
              <p style="margin:16px 0 0 0;font-size:12px;color:#64748b;">Bu e-posta otomatik olarak gönderilmiştir.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f1f5f9;color:#475569;padding:14px 24px;font-size:12px;">© ${new Date().getFullYear()} SözleşmePRO - Sözleşme Takip Yönetim Sistemi</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  </body></html>`
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'check-expiring') {
      return await checkExpiringContracts()
    }

    if (action === 'send-notification') {
      const { contractId, daysBefore } = body
      return await sendNotification(contractId, daysBefore)
    }

    if (action === 'send-pending') {
      return await sendPendingNotifications()
    }

    return ApiResponse.validationError([{ field: 'action', message: 'Geçersiz işlem' }])
  } catch (error) {
    return ApiResponse.internalError('Bildirim API hatası')
  }
}
export const POST = withCommonMiddleware(postHandler)

async function checkExpiringContracts() {
  try {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Get contracts expiring in the next 30 days
    const expiringContracts = await db.contract.findMany({
      where: {
        endDate: {
          gte: today,
          lte: thirtyDaysFromNow
        },
        status: 'ACTIVE'
      },
      include: {
        department: true,
        notifications: {
          where: {
            isSent: false
          }
        }
      }
    })

    const notificationsToCreate: Array<{
      contractId: string
      type: 'EXPIRATION_WARNING'
      daysBefore: number
      subject: string
      message: string
      isSent: boolean
    }> = []

    for (const contract of expiringContracts) {
      const daysUntilExpiry = Math.ceil((contract.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Check if we need to create notifications for specific days
      const notificationDays = [30, 15, 7, 1]

      for (const days of notificationDays) {
        if (daysUntilExpiry <= days && daysUntilExpiry > days - 1) {
          // Check if notification already exists for this day
          const existingNotification = contract.notifications.find(n => n.daysBefore === days)

          if (!existingNotification) {
            notificationsToCreate.push({
              contractId: contract.id,
              type: 'EXPIRATION_WARNING',
              daysBefore: days,
              subject: `Sözleşme Uyarısı: ${contract.subject}`,
              message: `${contract.subject} sözleşmesi ${days} gün içinde sona erecek. Sözleşme No: ${contract.contractNumber}`,
              isSent: false
            })
          }
        }
      }
    }

    // Create notifications in database
    if (notificationsToCreate.length > 0) {
      await db.notification.createMany({
        data: notificationsToCreate
      })
    }

    return ApiResponse.success({
      message: 'Kontrol tamamlandı',
      contractsFound: expiringContracts.length,
      notificationsCreated: notificationsToCreate.length
    })

  } catch (error) {
    return ApiResponse.internalError('Kontrol başarısız')
  }
}

async function sendNotification(contractIdOrNumber: string, daysBefore: number) {
  try {
    // Get the contract with related data (by id or by contractNumber)
    let contract = await db.contract.findUnique({
      where: { id: contractIdOrNumber },
      include: {
        department: true,
        notifications: {
          where: {
            daysBefore: daysBefore,
            isSent: false
          }
        }
      }
    })

    if (!contract) {
      contract = await db.contract.findFirst({
        where: { contractNumber: contractIdOrNumber },
        include: {
          department: true,
          notifications: {
            where: {
              daysBefore: daysBefore,
              isSent: false
            }
          }
        }
      })
    }

    if (!contract) {
      return ApiResponse.notFound('Sözleşme bulunamadı')
    }

    const recipient = contract.department?.email || ''
    if (!recipient) {
      return ApiResponse.validationError([{ field: 'email', message: 'Birim e-posta bulunamadı' }])
    }

    const smtpConfig = await db.smtpConfig.findFirst({
      where: { isActive: true }
    })

    if (!smtpConfig) {
      const host = process.env.SMTP_HOST
      const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
      const user = process.env.SMTP_USER
      const pass = process.env.SMTP_PASS
      const fromEmail = process.env.SMTP_FROM
      const fromName = process.env.SMTP_NAME || 'SözleşmePRO - Sözleşme Takip Yönetim Sistemi'
      if (!host || !port || !user || !pass || !fromEmail) {
        return ApiResponse.validationError([{ field: 'smtp', message: 'Aktif SMTP yapılandırması yok' }])
      }
      const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
      const notification = contract.notifications[0]
      if (!notification) {
        return ApiResponse.notFound('Bekleyen bildirim yok')
      }
      await transporter.sendMail({ from: `${fromName} <${fromEmail}>`, to: recipient, subject: notification.subject, text: notification.message, html: buildEmailHtml(notification.subject, notification.message, contract) })
      await db.notification.update({ where: { id: notification.id }, data: { isSent: true, sentAt: new Date() } })
      return ApiResponse.success({ message: 'Bildirim gönderildi', contractId: contract.id, daysBefore, email: contract.department.email })
    }

    const notification = contract.notifications[0]
    if (!notification) {
      return ApiResponse.notFound('Bekleyen bildirim yok')
    }

    const transporter = nodemailer.createTransport({ host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.secure, auth: { user: smtpConfig.username, pass: smtpConfig.password } })
    const fromEmail = smtpConfig.fromEmail
    const fromName = smtpConfig.fromName || 'SözleşmePRO - Sözleşme Takip Yönetim Sistemi'
    await transporter.sendMail({ from: `${fromName} <${fromEmail}>`, to: recipient, subject: notification.subject, text: notification.message, html: buildEmailHtml(notification.subject, notification.message, contract) })
    await db.notification.update({ where: { id: notification.id }, data: { isSent: true, sentAt: new Date(), smtpConfigId: smtpConfig.id } })
    return ApiResponse.success({ message: 'Bildirim gönderildi', contractId: contract.id, daysBefore, email: contract.department.email })

  } catch (error) {
    return ApiResponse.internalError('Bildirim gönderilemedi')
  }
}

async function sendPendingNotifications() {
  try {
    const pending = await db.notification.findMany({ where: { isSent: false }, include: { contract: { include: { department: true } } } })
    if (pending.length === 0) {
      return ApiResponse.success({ message: 'Bekleyen bildirim yok', sent: 0 })
    }
    const smtpConfig = await db.smtpConfig.findFirst({ where: { isActive: true } })
    let transporter: nodemailer.Transporter
    if (smtpConfig) {
      transporter = nodemailer.createTransport({ host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.secure, auth: { user: smtpConfig.username, pass: smtpConfig.password } })
    } else {
      const host = process.env.SMTP_HOST
      const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
      const user = process.env.SMTP_USER
      const pass = process.env.SMTP_PASS
      if (!host || !port || !user || !pass) {
        return ApiResponse.validationError([{ field: 'smtp', message: 'SMTP yapılandırması eksik' }])
      }
      transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
    }
    const fromEmail = smtpConfig?.fromEmail || process.env.SMTP_FROM || ''
    const fromName = smtpConfig?.fromName || process.env.SMTP_NAME || 'Contract Tracker'
    let sent = 0
    let skipped = 0
    let failed = 0
    for (const n of pending) {
      const to = n.contract?.department?.email || ''
      if (!to) {
        skipped++
        continue
      }
      try {
        await transporter.sendMail({ from: `${fromName} <${fromEmail}>`, to, subject: n.subject, text: n.message, html: buildEmailHtml(n.subject, n.message, n.contract) })
        await db.notification.update({ where: { id: n.id }, data: { isSent: true, sentAt: new Date(), smtpConfigId: smtpConfig?.id } })
        sent++
      } catch (e) {
        failed++
      }
    }
    return ApiResponse.success({ message: 'Bildirimler gönderildi', sent, skipped, failed })
  } catch (error) {
    return ApiResponse.internalError('Toplu gönderim başarısız')
  }
}

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')

    if (contractId) {
      // Get notifications for a specific contract
      const notifications = await db.notification.findMany({
        where: { contractId },
        orderBy: { createdAt: 'desc' }
      })

      return ApiResponse.success({ notifications })
    } else {
      // Get all pending notifications
      const notifications = await db.notification.findMany({
        where: { isSent: false },
        include: {
          contract: {
            include: {
              department: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return ApiResponse.success({ notifications })
    }
  } catch (error: any) {
    console.error('Notification API Error:', error)
    return ApiResponse.internalError('Bildirimler alınamadı: ' + (error?.message || error))
  }
}
export const GET = withCommonMiddleware(getHandler)