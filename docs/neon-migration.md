# Migrasi Total Supabase AJW ke Neon

Tujuan: pindahkan semua tabel AJW dari Supabase ke Neon lewat backend/script lokal, dengan egress hanya sekali saat migrasi.

## 1. Isi `.env.neon-migration`

Jangan commit file `.env.neon-migration`. File ini khusus migrasi, supaya tidak mengganggu `.env` aplikasi.

```env
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi_service_role_key
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
```

Opsional:

```env
MIGRATE_BATCH_SIZE=500
MIGRATE_INCLUDE_SHOPEE=false
PG_CONNECT_TIMEOUT_MS=20000
PG_DNS_ORDER=ipv4first
MIGRATE_ONLY=ajw_fin_income,ajw_fin_expense
```

Jika koneksi Neon timeout di port `5432`, gunakan pooled connection string dari Neon. Host pooled biasanya mengandung `-pooler`, contoh `ep-xxx-pooler.region.aws.neon.tech`.

Jangan gunakan user `authenticator` atau URL REST/Data API. Migrasi butuh PostgreSQL connection string dengan role owner, biasanya `neondb_owner`.

## 2. Jalankan migrasi

```powershell
npm run migrate:supabase-to-neon
```

Script akan:

- membuat schema kompatibel di Neon;
- baca semua row dari Supabase per batch;
- simpan backup JSON di `backups/supabase-to-neon-*`;
- upsert ke Neon;
- tampilkan summary jumlah row source vs Neon.

## 3. Hemat egress setelah migrasi

- Jangan load seluruh tabel untuk dashboard.
- Pakai endpoint backend dengan pagination, filter tanggal, dan summary SQL.
- Simpan file besar di R2/S3, Neon hanya metadata.
- Export besar dibuat async dari backend.

## Catatan

View `generate_image_prompt_library_view` dibuat ulang di Neon dari tabel prompt dan asset. Data view tidak dimigrasikan karena view bukan tabel fisik.
