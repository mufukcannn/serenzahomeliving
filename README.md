# Serenza Home Living Commerce

Next.js App Router, TypeScript, Tailwind, Framer Motion, Prisma ve PostgreSQL ile kurulmuş premium showroom odaklı e-ticaret iskeleti.

## Kurulum

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Ödeme sağlayıcısı varsayılan olarak `PAYMENT_PROVIDER=paytr` ile çalışır. Checkout ekranında yalnızca PayTR iFrame API aktiftir.

Ödeme mimarisi provider registry ile çalışır:

- `lib/payments/types.ts`: ortak provider interface.
- `lib/payments/index.ts`: provider registry.
- `lib/payments/paytr.ts`: PayTR iFrame adapter.

Aktif ödeme ayarı:

```bash
PAYMENT_PROVIDER="paytr"
```

iyzico ve Stripe için eski adapter dosyaları mimari referans olarak korunabilir, ancak production checkout akışı PayTR dışında provider çalıştırmaz.

## PayTR iFrame API

`.env` içine PayTR panelindeki bilgileri ekleyin:

```bash
PAYMENT_PROVIDER="paytr"
PAYTR_MERCHANT_ID=""
PAYTR_MERCHANT_KEY=""
PAYTR_MERCHANT_SALT=""
PAYTR_SUCCESS_URL="https://serenzahomeliving.com/order-success"
PAYTR_FAIL_URL="https://serenzahomeliving.com/payment/failed"
PAYTR_CALLBACK_URL="https://serenzahomeliving.com/api/payment/webhook/paytr"
PAYTR_TEST_MODE="1"
PAYTR_DEBUG_ON="1"
APP_URL="https://serenzahomeliving.com"
```

Akış:

1. Kullanıcı `/checkout` sayfasına gelir; ödeme yöntemi PayTR olarak sabittir.
2. `POST /api/checkout` pending siparişi oluşturur, stok rezervasyonu yapar ve PayTR `get-token` endpointinden iFrame token alır.
3. Frontend `https://www.paytr.com/odeme/guvenli/{token}` adresini iFrame içinde açar.
4. PayTR panelinde bildirim/callback URL olarak `https://serenzahomeliving.com/api/payment/webhook/paytr` tanımlanır.
5. Webhook hash doğrulaması yapılır. Güvenli olmayan callback işlem yapmadan `FAIL` döner.
6. Başarılı işlem `paymentStatus=paid`, `orderStatus=processing` yapar ve stok bu anda düşer.
7. Başarısız işlem `paymentStatus=failed`, `orderStatus=cancelled` yapar ve rezervasyonu serbest bırakır.
8. Duplicate callback kayıtları `PaymentLog` içinde işaretlenir ve ikinci kez sipariş/stok durumu bozulmaz.

PayTR canlı moda geçerken `PAYTR_TEST_MODE="0"` ve `PAYTR_DEBUG_ON="0"` kullanın. Kart bilgileri Serenza Home Living veritabanında tutulmaz.

## Mimari Notlar

- Tek stok kaynağı PostgreSQL içindeki `Inventory` tablosudur.
- Web checkout pending rezervasyon oluşturur; stok sadece PayTR başarılı callback doğrulandıktan sonra Prisma transaction içinde düşer.
- Trendyol sipariş içe alma işlemleri ödeme tamamlanmış pazaryeri siparişi kabul edilerek Prisma transaction içinde stok düşer.
- Web siparişi sonrası Trendyol stok güncellemesi servis katmanına bırakılır.
- Trendyol API bilgileri `.env` üzerinden okunur.
- Trendyol mağaza vitrini referansı: `TRENDYOL_STORE_URL`.
- Admin panel ilk aşamada ürün, sipariş, stok, fiyat, kategori, görsel ve SEO yönetim alanlarını gösteren iskelet olarak hazırdır.

## Önemli Akışlar

- `POST /api/checkout`: Sepetten pending sipariş oluşturur, stok rezervasyonu yapar, PayTR iFrame ödeme oturumu döndürür.
- `POST /api/payment/webhook/[provider]`: Ödeme sonucunu doğrular, siparişi `paid`, `failed` veya `cancelled` yapar.
- `PATCH /api/admin/orders/[id]/invoice`: Manuel kesilen fatura numarası ve PDF linkini siparişe işler, müşteri mail bildirimi için notification servis katmanını çağırır.
- `POST /api/marketplaces/trendyol/sync-orders`: Trendyol siparişlerini içeri alır ve stok düşer.

## Fatura Altyapısı

- Checkout bireysel ve kurumsal fatura bilgilerini ayrı toplar.
- Teslimat adresi ve fatura adresi ayrı tutulabilir; "Fatura adresim teslimat adresimle aynı" seçeneği desteklenir.
- Sipariş üzerinde `invoice_type`, `invoice_status`, `invoice_number`, `invoice_url`, `billing_*` alanları tutulur.
- Otomatik e-fatura kesimi şu an kapalıdır; `services/invoices` içinde Paraşüt, Logo, Mikro ve Uyumsoft adaptörlerine uygun provider yapısı hazırdır.

## Güvenlik

- PayTR callback hash doğrulaması server tarafında yapılır.
- Checkout ve webhook endpointlerinde basit IP tabanlı rate limit vardır.
- SQL injection riskine karşı Prisma ve Zod validasyon kullanılır.
- Ödeme denemeleri, başarısız işlemler, hash hataları ve duplicate callback kayıtları `PaymentLog` tablosuna yazılır.
- Yüksek tutarlı siparişlerde fraud review sinyali payment log içinde saklanır.
