# Serenza Home Living Plesk Deployment

## Paket Icerigi

Bu paket production build, kaynak kod, Prisma schema ve public assetleri icerir.
Gercek `.env`, `.env.save`, `node_modules`, cache ve upload dosyalari pakete dahil edilmez.

## Plesk Ortam Degiskenleri

Plesk Node.js uygulama ayarlarinda asagidaki degerleri girin:

```env
NODE_ENV=production
APP_URL=https://alanadiniz.com
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME

PANEL_AUTH_ENABLED=true
PANEL_AUTH_USER=admin
PANEL_AUTH_PASSWORD=guclu-bir-sifre
```

Odeme ve pazaryeri icin gerekli PayTR, Trendyol, kargo ve entegrasyon degerlerini de
Plesk environment alanindan girin. `.env.example` sadece sablon olarak kullanilmalidir.

## Plesk Komutlari

Uygulamayi yukledikten sonra:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

Plesk startup komutu:

```bash
npm run start
```

## Guvenlik Notlari

- Plesk SSL/HTTPS aktif olmalidir.
- `/admin`, `/api/admin` ve ileride eklenecek panel yollari Basic Auth ile korunur.
- Gercek API key, secret ve sifreleri repoya veya pakete koymayin.
- `public/uploads` CDN/R2/S3 gibi dis depolamaya tasinmalidir.
