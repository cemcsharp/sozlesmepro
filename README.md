# SözleşmePRO - Sözleşme Takip Yönetim Sistemi

SözleşmePRO, kurumsal sözleşmelerinizi dijital ortamda takip etmenizi, süre sonlarını kontrol etmenizi ve bildirimler almanızı sağlayan kapsamlı bir yönetim sistemidir.

## 🚀 Kurulum (Windows Sunucu veya İstemci)

Uygulamayı bir Windows ortamında kurmak ve çalıştırmak için her şey otomatikleştirilmiştir. Docker'a **ihtiyacınız yoktur**. Tek gereken Node.js ve PostgreSQL veritabanıdır.

## 🚀 Hızlı Kurulum (Windows)

Uygulamayı kendi sunucunuza veya bir arkadaşınızın bilgisayarına kurmak için şu adımları izleyin:

1.  **Ön Hazırlık:** Bilgisayarda [Docker Desktop](https://www.docker.com/products/docker-desktop/) kurulu ve çalışıyor olmalıdır.
2.  **Kurulumu Başlatın:** Proje klasörü içindeki `install.ps1` dosyasına sağ tıklayın ve **"PowerShell ile çalıştır"** (Run with PowerShell) seçeneğini seçin.
3.  **Sihirbazı Takip Edin:** Ekranda size sorulan uygulama adresi, yönetici e-postası ve şifresi gibi bilgileri girin.
4.  **Tamamlandı:** Script tüm ayarları yapacak, veritabanını kuracak ve uygulamayı yayına alacaktır.

---

## 🛠 Manuel Yapılandırma
Eğer her şeyi manuel kontrol etmek isterseniz:
1. `.env.example` dosyasını `.env` olarak kopyalayın.
2. İçindeki ayarları kendinize göre düzenleyin.
3. terminalde `docker-compose up -d --build` komutunu çalıştırın.

### 3- Sunucuyu Başlatma
Kurulum tamamlandıktan sonra, uygulamayı PM2 işlem yöneticisi ile (arka planda kesintisiz) çalıştırmak için şu betiği kullanın:
```powershell
.\start.ps1
```

*(Not: Eğer PM2 sisteminizde yoksa, bu betik otomatik olarak indirecek ve uygulamanızı `"sozlesmepro"` adıyla arka planda ayağa kaldıracaktır.)*

### 4- Güncelleme Yapma
Uygulamanın yeni bir sürümü yayınlandığında aşağıdaki betiği çalıştırmanız yeterlidir:
```powershell
.\update.ps1
```
Bu betik; en son kodları çeker, bağımlılıkları yükler, veritabanını günceller, projeyi derler ve PM2 servisini yeniden başlatır.

---
- **`uninstall.sh` / `uninstall.ps1`**: Sistemi güvenli bir şekilde kaldırır.
- **`docs/`**: Detaylı manuel kurulum rehberleri.

## 📖 Detaylı Kurulum Rehberleri

Daha fazla detay ve manuel yapılandırma seçenekleri için aşağıdaki rehberlere göz atabilirsiniz:

- [Windows Server Kurulumu](docs/INSTALL_WINDOWS.md)
- [Ubuntu Server Kurulumu](docs/INSTALL_UBUNTU.md)

---
© 2026 SözleşmePRO - Tüm Hakları Saklıdır.
