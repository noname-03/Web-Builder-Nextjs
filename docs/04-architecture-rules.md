# 4. Architecture & Tech Stack Rules

Aturan di bawah **wajib** dipatuhi. Pelanggaran dianggap bug.

## 4.1 Dependency Whitelist

**Runtime:** `next@16`, `react@19`, `react-dom@19`, `@prisma/client@6`, `zod`, `bcryptjs`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `zustand`, `immer`, `nanoid`, `clsx`, `lucide-react`, `sonner`

**Dev:** `typescript`, `prisma@6`, `tailwindcss@4`, `@tailwindcss/postcss`, `eslint`, `eslint-config-next`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/bcryptjs`, `tsx`, `vitest`

Library lain: **dilarang** tanpa alasan tertulis. Dilarang: `bcrypt`, `argon2` (native binding di Windows), NextAuth/Auth.js, tRPC, Redux, axios, moment, lodash, UI kit besar (MUI, Chakra, Ant).

## 4.2 Struktur Folder (Clean Architecture ringan)

```
src/
  app/                         # Routing & komposisi halaman SAJA
    (marketing)/page.tsx
    (auth)/login/page.tsx
    (auth)/register/page.tsx
    (app)/dashboard/...
    (app)/layout.tsx
    admin/...
    editor/[pageId]/...
    api/pages/[pageId]/export/route.ts
    api/health/route.ts
  proxy.ts                     # Optimistic redirect berbasis cookie
  features/                    # Satu folder per fitur
    auth/
      actions.ts               # "use server": Server Actions (tipis)
      schemas.ts               # Zod
      components/
    projects/ ...
    pages/ ...
    editor/
      components/              # Palette, Canvas, Inspector, Toolbar
      store/                   # Zustand store
      blocks/                  # registry: tipe blok → definisi default, schema props, renderer editor
      lib/                     # operasi pohon (insert, move, remove, clone)
    export/
      render-html.ts           # Fungsi murni: BuilderDocument → string HTML
    admin/ ...
  server/                      # Kode server-only (import "server-only")
    db.ts                      # Prisma singleton
    auth/                      # session.ts, password.ts, guards.ts
    services/                  # Logika bisnis (satu file per agregat)
    repositories/              # Akses Prisma (satu file per agregat)
    rate-limit.ts
  lib/                         # Util umum (client & server aman)
    result.ts                  # ActionResult<T>
    errors.ts                  # AppError + kode error
    slug.ts
    env.ts                     # Validasi env dengan Zod
  components/ui/               # Komponen UI generik (Button, Input, Dialog, ...)
  types/
prisma/
  schema.prisma
  seed.ts
  migrations/
docs/
```

## 4.3 Aturan Layering (Dependency Direction)

```
app/ (page, route)  →  features/*/actions.ts  →  server/services  →  server/repositories  →  server/db
```

1. **Page/Route** tidak boleh memanggil Prisma langsung. Mereka memanggil service (untuk data fetching di Server Component) atau action.
2. **Server Action** hanya: (a) autentikasi/otorisasi via guard, (b) parse input dengan Zod, (c) panggil service, (d) `revalidatePath` bila perlu, (e) bungkus hasil ke `ActionResult`.
3. **Service** berisi aturan bisnis dan transaksi. Tidak mengenal `FormData`, `cookies`, atau `Response`.
4. **Repository** satu-satunya tempat yang mengimpor `server/db`. Tidak berisi aturan bisnis.
5. File di `server/` wajib diawali `import "server-only";`.
6. Komponen client (`"use client"`) dilarang mengimpor apa pun dari `server/`.

## 4.4 Aturan Next.js

1. **Mutasi data = Server Actions** (`"use server"`). Dilarang membuat API route untuk CRUD. Route Handler hanya untuk `export` dan `health`.
2. Server Component adalah default. `"use client"` hanya untuk komponen interaktif (editor, form dengan state, dialog).
3. Data fetching di Server Component, bukan `useEffect`.
4. `params`, `searchParams`, `cookies()`, `headers()` wajib di-`await` (Next 16).
5. Gunakan `proxy.ts` (bukan `middleware.ts`) hanya untuk redirect cepat berdasarkan keberadaan cookie. **Otorisasi sebenarnya tetap di server** lewat guard di layout/action/route (defense in depth).
6. Gunakan `loading.tsx` dan `error.tsx` di segmen `(app)`, `editor`, dan `admin`.
7. Form: gunakan `useActionState` + komponen tombol dengan `useFormStatus` untuk status pending.
8. Metadata via `export const metadata` atau `generateMetadata`.
9. Env var server tidak boleh berawalan `NEXT_PUBLIC_`.

## 4.5 Aturan TypeScript & Kode

1. `strict: true`, `noUncheckedIndexedAccess: true`. Dilarang `any` (gunakan `unknown` + narrowing). Dilarang `@ts-ignore`.
2. Fungsi dengan 2+ parameter menerima **satu objek parameter**.
3. Gunakan `const`; hindari `let` kecuali perlu.
4. Named export (kecuali `page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, dll. yang diwajibkan Next).
5. Nama file `kebab-case`; komponen `PascalCase`; fungsi `camelCase`; konstanta `UPPER_SNAKE_CASE`.
6. **Tanpa komentar** kecuali logika yang benar-benar tidak jelas.
7. Satu file satu tanggung jawab; target < 200 baris.
8. Semua input eksternal (FormData, JSON body, query, env) **wajib** divalidasi Zod sebelum dipakai.
9. Gunakan path alias `@/*` → `src/*`.

## 4.6 Kontrak Error & Result

```ts
// src/lib/result.ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fieldErrors?: Record<string, string[]> } };

// src/lib/errors.ts
export type ErrorCode =
  | "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND"
  | "CONFLICT" | "RATE_LIMITED" | "REVISION_CONFLICT" | "INTERNAL";

export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public fieldErrors?: Record<string, string[]>) {
    super(message);
  }
}
```

- Service melempar `AppError`. Action menangkap dan mengubahnya menjadi `ActionResult`. Error tak dikenal → log server (`console.error` dengan id acak) dan kembalikan `INTERNAL` dengan pesan generik "Terjadi kesalahan. Coba lagi."
- Action **tidak boleh** melempar error ke client untuk kasus yang diharapkan.
- Prisma error `P2002` (unique) → `CONFLICT`; `P2025` → `NOT_FOUND`.

## 4.7 Aturan Database & Prisma

1. Prisma Client singleton di `server/db.ts` (cache di `globalThis` saat dev).
2. Operasi multi-tabel **wajib** `prisma.$transaction`.
3. Dilarang `$queryRawUnsafe`. Raw query hanya `$queryRaw` tagged template (parameterized), dan hanya bila terpaksa.
4. Gunakan `select` eksplisit; **jangan** mengirim `passwordHash` atau `tokenHash` ke luar repository auth.
5. Query list wajib punya `take` (pagination).
6. Filter `deletedAt: null` pada semua query Project/Page.
7. Perubahan schema hanya lewat migration (`prisma migrate dev`), tidak pernah `db push`.

## 4.8 Aturan UI / Styling

1. **Mobile-first:** tulis class dasar untuk mobile, tambah `sm:`/`md:`/`lg:` untuk layar lebih besar. Dilarang `max-w-*`-first atau desktop-first.
2. Tailwind v4 (`@import "tailwindcss";` di `globals.css`). Tidak ada file `tailwind.config.js` kecuali dibutuhkan.
3. Komponen UI generik di `components/ui/` dengan varian lewat props (tanpa library varian tambahan; gunakan `clsx`).
4. Target sentuh minimal 44x44px untuk tombol di mobile.
5. Semua teks UI Bahasa Indonesia, disimpan sebagai string literal di komponen (tanpa i18n library).
6. Aksesibilitas: `label` untuk input, `aria-label` untuk tombol ikon, `aria-live="polite"` untuk pesan status/error form, urutan fokus logis, `Esc` menutup dialog.
7. Editor: desktop-only (>= 1024px), di bawahnya tampilkan pesan pengganti.

## 4.9 Aturan Editor (Zustand)

1. Store memegang: `document`, `selectedId`, `viewport`, `saveStatus`, `revision`, `history` (past/future).
2. Semua perubahan dokumen lewat **action murni** di `lib/` (fungsi `insertBlock`, `moveBlock`, `removeBlock`, `cloneBlock`, `updateProps`, `updateStyle`) yang mengembalikan dokumen baru dan memvalidasi aturan struktur (lihat 02 bagian 2.4). Store memanggil fungsi ini dengan `immer`.
3. Setiap action mutasi mendorong snapshot ke `history.past` (maks 50) dan mengosongkan `future`.
4. Registry blok (`features/editor/blocks/registry.ts`) adalah satu-satunya tempat mendefinisikan tipe blok: `{ type, label, icon, isContainer, defaultProps, defaultStyle, propsSchema, allowedChildren }`. Menambah blok baru = menambah satu entri registry + renderer.
5. Renderer editor (React) dan renderer export (string HTML) adalah dua implementasi terpisah dengan **output visual setara**. Renderer export **wajib meng-escape** semua teks dan atribut.
6. ID blok dibuat dengan `nanoid(10)` di client.
7. Drag & drop memakai `@dnd-kit`; dua jenis draggable: item palette (buat blok baru) dan blok di kanvas (pindah). Drop target: area di dalam container dan di antara sibling. Tolak drop yang melanggar `allowedChildren` (tampilkan indikator tidak valid).

## 4.10 Aturan Testing

- `vitest` untuk unit test fungsi murni: operasi pohon, validasi dokumen (Zod), `render-html`, `slug`, sanitasi URL/style.
- Minimal test wajib: lihat Task 4.7 di `03-task-list.md`.
- Tidak perlu E2E di MVP.

## 4.11 Environment Variables

`.env.example` wajib berisi dan divalidasi di `lib/env.ts`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/webbuilder?schema=public"
SESSION_COOKIE_NAME="wb_session"
SESSION_TTL_DAYS="7"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="ChangeMe123!"
APP_URL="http://localhost:3000"
```

`.env` tidak boleh di-commit (masukkan ke `.gitignore`).
