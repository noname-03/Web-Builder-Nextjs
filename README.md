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
