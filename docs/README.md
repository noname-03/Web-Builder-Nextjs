# Web Builder: Blueprint untuk AI Code Executor

Aplikasi web untuk membuat halaman HTML dengan **drag & drop**, menyimpannya di **PostgreSQL**, lalu **export/download** sebagai file `.html`.

## Cara Memakai Dokumen Ini (Instruksi untuk AI Eksekutor)

1. Baca **semua** file di bawah secara berurutan sebelum menulis kode.
2. Kerjakan task di `03-task-list.md` **satu per satu, sesuai urutan**. Jangan menggabungkan atau melewati task.
3. Setelah tiap task selesai, jalankan: `npm run typecheck && npm run lint`. Jika gagal, perbaiki dulu sebelum lanjut.
4. Jika ada konflik antar dokumen, prioritasnya: `04-architecture-rules.md` > `02-database-design.md` > `01-prd.md` > `03-task-list.md`.
5. Jangan menambah fitur di luar PRD. Jangan menambah library di luar daftar "Dependency Whitelist" tanpa alasan tertulis.
6. Tulis kode tanpa komentar, kecuali logika yang tidak self-evident.

## Daftar File

| File | Isi |
|---|---|
| [01-prd.md](./01-prd.md) | Fitur, user flow, role & permission, scope MVP |
| [02-database-design.md](./02-database-design.md) | Prisma schema, SQL migration tambahan, format JSON dokumen builder |
| [03-task-list.md](./03-task-list.md) | Task modular per fase (1: Setup & DB, 2: Backend, 3: UI, 4: Integrasi) |
| [04-architecture-rules.md](./04-architecture-rules.md) | Aturan kode, struktur folder, dependency whitelist |
| [05-edge-cases-security.md](./05-edge-cases-security.md) | Penanganan error, keamanan, skenario krusial |

## Keputusan Teknis Final (Tidak Perlu Ditanyakan Ulang)

| Topik | Keputusan |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Database | PostgreSQL 15+ |
| ORM | Prisma **6.x** (pin versi major 6, `prisma-client-js`, jangan pakai Prisma 7) |
| Styling | Tailwind CSS v4 |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| State editor | Zustand + middleware `immer` |
| Validasi | Zod |
| Auth | Custom session di DB (cookie opaque token, hash SHA-256 di DB), password `bcryptjs` |
| Mutasi data | Server Actions |
| Route Handler | Hanya untuk: export download, health check |
| Export | Server-side render JSON ke satu file `.html` dengan CSS inline di `<style>` |
| Gambar | Hanya URL eksternal (`https`). Tidak ada upload file di MVP |
| Bahasa UI | Bahasa Indonesia |
| Package manager | npm |
| OS dev | Windows (Laragon). Hindari library dengan native binding (pakai `bcryptjs`, bukan `bcrypt`/`argon2`) |

## Catatan Next.js 16 yang Wajib Diingat

- `params` dan `searchParams` di page/route handler bersifat **Promise**: wajib `await`.
- `cookies()` dan `headers()` dari `next/headers` bersifat **async**: wajib `await`.
- File `middleware.ts` diganti nama menjadi **`proxy.ts`** (export function bernama `proxy`).
- Gunakan Turbopack (default).
