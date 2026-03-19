import nodemailer from 'nodemailer'

interface EmailOptions {
    to: string
    subject: string
    html: string
}

export const sendEmail = async (options: EmailOptions) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })

        await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'SozlesmePRO'}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        })

        return { success: true }
    } catch (error) {
        console.error('Email sending failed:', error)
        return { success: false, error }
    }
}

export const getContractCreatedEmailTemplate = (contractNumber: string, subject: string, link: string) => {
    return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #2563eb; text-align: center;">Yeni Sözleşme Oluşturuldu</h2>
      <p>Merhaba,</p>
      <p>Sisteme yeni bir sözleşme kaydı eklendi. Detaylar aşağıdadır:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Sözleşme No:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${contractNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Konu:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${subject}</td>
        </tr>
      </table>
      <div style="text-align: center; margin-top: 25px;">
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Sözleşmeyi Görüntüle</a>
      </div>
      <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
        Bu e-posta SozlesmePRO tarafından otomatik olarak gönderilmiştir.
      </p>
    </div>
  `
}
