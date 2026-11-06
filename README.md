# Web Builder

Aplikasi web untuk membuat halaman HTML dengan drag & drop, menyimpan project di PostgreSQL, dan mengunduh hasilnya sebagai file HTML.

## Prasyarat

- Node.js 22+
- npm 10+
- PostgreSQL 14+ (blueprint menargetkan 15+, PostgreSQL 14 sudah memenuhi seluruh fitur yang dipakai)

## Setup

1. Install dependency:

   ```bash
   npm install
   ```

2. Salin environment:

   ```bash
   cp .env.example .env
   ```

   Sesuaikan `DATABASE_URL` dengan kredensial PostgreSQL Anda.

3. Buat database (jika belum ada):

   ```bash
   createdb -h 127.0.0.1 -U postgres webbuilder
   ```

4. Jalankan migration:

   ```bash
   npx prisma migrate dev
   ```

5. Isi data awal (admin + template):

   ```bash
   npm run db:seed
   ```

6. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

Buka `http://localhost:3000`.

## Akun Admin Seed

Nilai default di `.env.example`:

- Email: `admin@example.com`
- Password: `ChangeMe123!`

Ganti `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` sebelum seed pada environment nyata.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Build produksi |
| `npm start` | Menjalankan hasil build |
| `npm run typecheck` | TypeScript tanpa emit |
| `npm run lint` | ESLint |
| `npm test` | Unit test (Vitest) |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:seed` | Seed admin dan template |
| `npm run db:studio` | Prisma Studio |

## Alur Singkat

1. Daftar di `/register` atau masuk di `/login`.
2. Buat project di `/dashboard`.
3. Buat halaman (kosong atau dari template) di dalam project.
4. Susun halaman di `/editor/[pageId]`: tarik blok dari palette, atur properti dan style, autosave berjalan otomatis.
5. Gunakan Preview, Riwayat versi, lalu Export untuk mengunduh `{slug}.html`.

Admin dapat mengelola user dan template di `/admin/users` dan `/admin/templates`.

## Struktur

```
src/
  app/           Routing (marketing, auth, dashboard, editor, admin, api)
  components/    Komponen UI generik
  features/      Kode per fitur (actions, schemas, components, store, lib)
  server/        db, auth, repositories, services (server-only)
  lib/           Util bersama (env, errors, result, slug)
prisma/          Schema, migration, seed
docs/            Blueprint produk dan teknis
```

## Catatan Environment

Jika `npx prisma` gagal mengunduh engine karena intercept TLS lokal (mis. antivirus/proxy), jalankan dengan:

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma migrate dev
```

Di PowerShell:

```powershell
$env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING="1"; $env:NODE_TLS_REJECT_UNAUTHORIZED="0"; npx prisma migrate dev
```

Hanya untuk mesin development lokal.

## AI Prompt Builder

Editor memiliki tab **Asisten AI** untuk membuat atau mengubah halaman dari prompt. Hasil AI hanya memakai blok yang tersedia di editor dan harus dikonfirmasi lewat pratinjau sebelum diterapkan.

### 1. Buat encryption key

API key provider disimpan terenkripsi (AES-256-GCM) di database. Wajib ada `ENCRYPTION_KEY` 32 byte base64:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Salin hasilnya ke `.env` sebagai `ENCRYPTION_KEY`. Jangan commit nilai ini.

### 2. Tambah provider

Buka `/settings/ai`, lalu isi:

- **Base URL** contoh: `https://api.openai.com/v1`, `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://api.deepseek.com/v1`
- **API key** provider
- **Model** (mis. `gpt-4o-mini`, `llama-3.3-70b-versatile`, `deepseek-chat`)

Provider lokal (`http://localhost:11434/v1` untuk Ollama, `http://localhost:1234/v1` untuk LM Studio) hanya diizinkan saat development.

API key tidak pernah dikirim kembali ke browser; UI hanya menampilkan 4 karakter terakhir. Gunakan tombol **Tes** untuk memverifikasi koneksi.

### 3. Operasional

| Perintah | Fungsi |
|---|---|
| `npm run ai:cleanup` | Hapus riwayat AI lebih tua dari 90 hari (env `AI_RETENTION_DAYS`, `AI_CLEANUP_BATCH`) |
| `npm run ai:reencrypt` | Re-enkripsi seluruh API key setelah rotasi kunci |

Rotasi kunci:

```bash
AI_REENCRYPT_OLD_KEY="<key-lama>" AI_REENCRYPT_NEW_KEY="<key-baru>" npm run ai:reencrypt -- --dry-run
AI_REENCRYPT_OLD_KEY="<key-lama>" AI_REENCRYPT_NEW_KEY="<key-baru>" npm run ai:reencrypt
```

Setelah rotasi, perbarui `ENCRYPTION_KEY` di `.env`.

### Batasan

- Endpoint harus kompatibel dengan `POST {baseUrl}/chat/completions`.
- Konten halaman dikirim ke provider yang dipilih user; jangan mengatur provider pihak ketiga tanpa persetujuan pengguna.
- Prompt injection tidak dapat mengubah format keluaran karena hasil selalu divalidasi `parseDocument` dan disanitasi sebelum dipakai.
