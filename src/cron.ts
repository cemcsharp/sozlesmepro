import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export function startSignatureReminderCron(cron: any) {
  // Her gün gece 01:00'de çalışır
  cron.schedule('0 1 * * *', async () => {
    console.log('[CRON] Eksik imza kontrolü başlatıldı...');
    try {
      const today = new Date();
      // Sadece DRAFT_EDITABLE belgesi olup SIGNED_FINAL belgesi OLMAYAN aktif sözleşmeleri getir
      const contracts = await db.contract.findMany({
        where: {
          status: 'ACTIVE',
          documents: {
            some: { type: 'DRAFT_EDITABLE' }
          }
        },
        include: {
          documents: true,
          department: true,
          company: true,
          notifications: true
        }
      });

      for (const contract of contracts) {
        // Zaten imzalı dosyası yüklenmiş mi diye teyit et
        const hasSigned = contract.documents.some((d: any) => d.type === 'SIGNED_FINAL');
        if (hasSigned) continue;

        // İlk taslak dosyasının yüklenme tarihini bul
        const drafts = contract.documents.filter((d: any) => d.type === 'DRAFT_EDITABLE');
        if (drafts.length === 0) continue;
        
        drafts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const earliestDraftDate = drafts[0].createdAt;

        // Kaç gün geçmiş hesapla
        const diffDays = Math.floor((today.getTime() - earliestDraftDate.getTime()) / (1000 * 60 * 60 * 24));

        // Tam 14, 28, 42... katları günlerde hatırlatma gönder
        if (diffDays > 0 && diffDays % 14 === 0) {
          
          // Bugün zaten gönderilmiş mi diye Notification tablosundan kontrol et
          const alreadySent = contract.notifications.some((n: any) => n.type === 'MISSING_SIGNATURE' && n.daysBefore === diffDays);
          
          if (!alreadySent) {
            console.log(`[CRON] ${contract.contractNumber} için eksik imza uyarısı gönderiliyor (${diffDays}. gün)`);
            
            // Bildirim kaydı oluştur
            await db.notification.create({
              data: {
                 type: 'MISSING_SIGNATURE',
                 daysBefore: diffDays, // Geçen süre (gün)
                 subject: `Eksik İmza Uyarısı: ${contract.subject}`,
                 message: `${contract.subject} sözleşmesinin imzalı nihai hali ${diffDays} gündür yüklenmemiştir. Lütfen kontrol ediniz. Sözleşme No: ${contract.contractNumber}`,
                 isSent: true,
                 sentAt: new Date(),
                 contractId: contract.id
              }
            });

            // E-posta Gönder
            const deptEmail = contract.department?.email;
            if (deptEmail) {
              const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <h2 style="color: #e11d48; text-align: center;">Sözleşme İmza Hatırlatması</h2>
                  <p>Merhaba,</p>
                  <p><strong>${contract.company?.name || 'Firmamız'}</strong> sisteminde yer alan <strong>${contract.contractNumber}</strong> numaralı sözleşme için imzalı kopyanın eksik olduğu tespit edilmiştir.</p>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Sözleşme No:</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${contract.contractNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Konu:</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${contract.subject}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Taslak Yüklenme:</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${diffDays} gün önce</td>
                    </tr>
                  </table>
                  <p style="margin-top: 15px;">Taslak belgesi sisteme <strong>${diffDays} gün</strong> önce yüklenmiş olup, <strong>İmzalı (Nihai)</strong> kopyası henüz sisteme eklenmemiştir. Süreci tamamlamak için lütfen imzalı belgeyi yükleyiniz.</p>
                  <div style="text-align: center; margin-top: 25px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contracts/edit/${contract.id}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Sözleşmeyi Güncelle</a>
                  </div>
                </div>
              `;
              await sendEmail({
                to: deptEmail,
                subject: `Eksik İmza Uyarısı: ${contract.contractNumber} - ${contract.subject}`,
                html
              });
            }
          }
        }
      }
      console.log('[CRON] Eksik imza kontrolü tamamlandı.');
    } catch (e) {
      console.error('[CRON Error] Eksik imza kontrolü çalıştırılamadı:', e);
    }
  });
}
