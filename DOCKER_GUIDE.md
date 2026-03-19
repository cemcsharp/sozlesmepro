# 🐳 SözleşmePRO - Docker Kurulum Rehberi

SözleşmePRO sistemini Docker üzerinden kurmak için aşağıdaki adımları izleyin. Bu rehber, uygulamanın en son sürümünü (Yeni Login Ekranı ve İyileştirilmiş Tasarım) içermektedir.

## 📋 Gereksinimler
- Bilgisayarınızda **Docker Desktop** kurulu ve çalışır durumda olmalıdır.

## 🚀 Hızlı Kurulum Adımları

### 1. Ortam Değişkenlerini Ayarlayın
Proje ana dizinindeki `.env.example` dosyasının adını `.env` olarak değiştirin ve içindeki bilgileri kendinize göre düzenleyin:
- `NEXTAUTH_SECRET` ve `AUTH_SECRET` kısımlarına rastgele uzun bir dizi yazın.
- `ADMIN_EMAIL` ve `ADMIN_PASSWORD` kısımlarına sistemin ilk açılışında kullanmak istediğiniz yönetici bilgilerini yazın.

### 2. Sistemi Başlatın
Terminali (PowerShell veya CMD) proje klasöründe açın ve şu komutu çalıştırın:

```bash
docker-compose up -d --build
```

Bu komut:
- Veritabanı ve uygulama konteynerlarını oluşturur.
- Veritabanı tablolarını otomatik hazırlar.
- Uygulamayı arka planda başlatır.

### 3. Kullanıma Başlayın
Uygulama hazır olduğunda tarayıcınızdan şu adrese gidin:
👉 [http://localhost:3000](http://localhost:3000)

**İlk Giriş:** `.env` dosyasında belirlediğiniz `ADMIN_EMAIL` ve `ADMIN_PASSWORD` bilgileri ile sisteme giriş yapabilirsiniz. İlk girişte sistem sizin için otomatik olarak Varsayılan Şirket ve Departman yapılandırmasını yapacaktır.

## 🛠️ Yararlı Komutlar

- **Logları İzlemek:** `docker-compose logs -f app`
- **Sistemi Durdurmak:** `docker-compose down`
- **Yeniden Başlatmak:** `docker-compose restart app`
- **Veritabanı Durumu:** `docker-compose ps` (Veritabanının `healthy` olduğundan emin olun)

## 📁 Dosya Yapısı
SözleşmePRO, Docker içinde çalışan bir hibrit sistemdir:
- **Veritabanı:** PostgreSQL (Docker Volume üzerinde saklanır, veri kaybı olmaz).
- **Dosyalar:** Yüklenen sözleşme belgeleri `/uploads` klasöründe Docker Volume içinde güvenle tutulur.

---
*İyi çalışmalar! Herhangi bir sorunda sistem loglarını kontrol etmeyi unutmayın.*
