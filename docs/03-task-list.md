# 3. Modular Task List (Step-by-Step)

**Aturan eksekusi:**
- Kerjakan berurutan. Satu task = satu unit kerja. Jangan digabung.
- Setiap task punya **Output** (file yang harus ada) dan **Selesai jika** (kriteria verifikasi).
- Setelah tiap task: `npm run typecheck` dan `npm run lint` harus lolos (kecuali Task 1.1 sebelum script dibuat).
- Rujuk `04-architecture-rules.md` untuk layering dan `05-edge-cases-security.md` untuk penanganan error.

---

## FASE 1: Setup & Database

### Task 1.1: Inisialisasi proyek
- Jalankan `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack` (direktori sudah berisi `docs/`; terima prompt overwrite untuk file non-docs).
- Install dependency sesuai whitelist (04 bagian 4.1).
- `package.json` scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `db:migrate` (`prisma migrate dev`), `db:seed` (`tsx prisma/seed.ts`), `db:studio`.
- `tsconfig.json`: aktifkan `strict` dan `noUncheckedIndexedAccess`.
- **Selesai jika:** `npm run dev` menampilkan halaman default; `npm run typecheck` lolos.

### Task 1.2: Environment & validasi env
- Buat `.env.example` (04 bagian 4.11) dan salin ke `.env`. Pastikan `.env` ada di `.gitignore`.
- Buat `src/lib/env.ts`: Zod schema, parse `process.env`, export objek `env`. Gagal parse → throw dengan daftar variabel yang salah.
- **Selesai jika:** menghapus `DATABASE_URL` dari `.env` membuat aplikasi gagal start dengan pesan jelas.

### Task 1.3: Utilitas inti
- `src/lib/errors.ts` (`AppError`, `ErrorCode`), `src/lib/result.ts` (`ActionResult`, helper `ok()`, `fail()`), `src/lib/slug.ts` (`slugify(text)`: lowercase, hapus diakritik, non-alfanumerik jadi `-`, trim `-`, fallback `halaman`, maks 100 karakter).
- **Selesai jika:** file ada dan ter-typecheck.

### Task 1.4: Prisma schema
- `npx prisma init` (pakai Prisma 6). Salin schema persis dari `02-database-design.md` bagian 2.1 ke `prisma/schema.prisma`.
- **Selesai jika:** `npx prisma validate` lolos.

### Task 1.5: Migration awal dan SQL tambahan
- Buat database PostgreSQL `webbuilder` (lokal via Laragon).
- Jalankan `npx prisma migrate dev --name init --create-only`.
- Tambahkan SQL dari `02-database-design.md` bagian 2.2 ke akhir `migration.sql`.
- Jalankan `npx prisma migrate dev`.
- **Selesai jika:** semua tabel, partial unique index, dan CHECK constraint ada (`\d pages` menampilkan index `pages_project_id_slug_active_key`).

### Task 1.6: Prisma client singleton
- `src/server/db.ts` dengan `import "server-only"` dan cache `globalThis`.
- **Selesai jika:** dapat diimpor dari server code tanpa error.

### Task 1.7: Skema dokumen builder (Zod)
- `src/features/editor/schemas/document.ts`: tipe `BuilderDocument`, `Block`, schema Zod per tipe blok (props strict), whitelist style, validator URL/style (05 bagian 5.6), dan fungsi `validateDocumentStructure(doc)` (aturan 02 bagian 2.4: root, orphan, siklus, aturan container, `column`/`columns`, batas 500 blok/kedalaman 12).
- Fungsi `createEmptyDocument(title?)` dan `normalizeDocument(raw: unknown)` (05 bagian 5.9).
- **Selesai jika:** diimpor tanpa error (test ada di Task 4.7).

### Task 1.8: Seed
- `prisma/seed.ts` sesuai 02 bagian 2.5. Template dibuat dengan `createEmptyDocument` + blok-blok valid. Konfigurasi `"prisma": { "seed": "tsx prisma/seed.ts" }` di `package.json`.
- **Selesai jika:** `npm run db:seed` dua kali berturut-turut tidak error dan tidak menggandakan data.

---

## FASE 2: Core Backend / API

> Urutan tiap fitur: repository → service → action. Semua file server diawali `import "server-only"`.

### Task 2.1: Password & session helper
- `src/server/auth/password.ts`: `hashPassword`, `verifyPassword` (`bcryptjs`, cost 12).
- `src/server/auth/session.ts`: `createSession({ userId, userAgent, ip })`, `getSession()` (baca cookie via `await cookies()`, hash SHA-256, validasi expired dan `isActive`), `destroySession()`, `extendSessionIfNeeded()`. Ikuti 05 bagian 5.1.
- **Selesai jika:** typecheck lolos.

### Task 2.2: Guard otorisasi
- `src/server/auth/guards.ts`: `requireUser()` (throw `AppError("UNAUTHENTICATED")`), `requireAdmin()` (throw `FORBIDDEN`), `getOptionalUser()`.
- **Selesai jika:** typecheck lolos.

### Task 2.3: Rate limiter login
- `src/server/rate-limit.ts` + `src/server/repositories/login-attempt-repository.ts`: `countRecentFailures({ email, ip })`, `recordAttempt`, `clearFailures`. Ambang 5 dalam 15 menit.
- **Selesai jika:** typecheck lolos.

### Task 2.4: Auth: register
- `features/auth/schemas.ts`: `registerSchema` (nama, email, password, confirmPassword).
- `server/repositories/user-repository.ts`, `server/services/auth-service.ts` → `register()` (transaksi user+session, tangkap `P2002`).
- `features/auth/actions.ts` → `registerAction(prevState, formData)`: validasi Zod → service → set cookie → `redirect("/dashboard")`.
- **Selesai jika:** pemanggilan dengan email duplikat mengembalikan `CONFLICT`, bukan crash.

### Task 2.5: Auth: login & logout
- `loginSchema`; `authService.login()` (rate limit, dummy compare, session baru, catat attempt, oportunistik hapus session/attempt kedaluwarsa); `loginAction`, `logoutAction`. Validasi `callbackUrl` (05 bagian 5.1).
- **Selesai jika:** 6 kali login salah berturut-turut mengembalikan `RATE_LIMITED` pada percobaan ke-6.

### Task 2.6: Project: repository, service, actions
- `project-repository.ts`, `project-service.ts`, `features/projects/actions.ts`: `createProject`, `renameProject`, `deleteProject` (soft), `listProjects` (pagination `take`). Semua dengan filter `userId` dan `deletedAt: null`.
- **Selesai jika:** akses project milik user lain mengembalikan `NOT_FOUND`.

### Task 2.7: Page: CRUD dasar
- `page-repository.ts`, `page-service.ts`, `features/pages/actions.ts`: `createPage({ projectId, title, templateId? })` (slug unik otomatis, 05 bagian 5.3; konten dari template atau `createEmptyDocument`), `renamePage`, `deletePage` (soft), `duplicatePage`, `listPages`, `getPageForEditor`.
- **Selesai jika:** membuat dua page berjudul sama menghasilkan slug `x` dan `x-2`.

### Task 2.8: Page: simpan konten (optimistic locking)
- `pageService.saveContent({ userId, pageId, content, baseRevision })`: cek ukuran, `normalizeDocument` + `validateDocumentStructure`, update dengan `revision` (05 bagian 5.4), sukses → return revision baru. Action `savePageContentAction`.
- **Selesai jika:** simpan dengan `baseRevision` lama mengembalikan `REVISION_CONFLICT`.

### Task 2.9: Versi page
- `version-repository.ts`, `version-service.ts`: `createSnapshot` (dalam transaksi, pangkas > 30), `listVersions`, `restoreVersion` (05 bagian 5.5). Action `createManualSnapshotAction`, `restoreVersionAction`.
- **Selesai jika:** setelah 31 snapshot, hanya 30 yang tersisa.

### Task 2.10: Renderer HTML export (fungsi murni)
- `src/features/export/render-html.ts`: `renderHtml(doc: BuilderDocument): string`. Dokumen HTML5 lengkap (`<!doctype html>`, `lang`, `meta charset`, `meta viewport`, `<title>`, `<style>` berisi reset kecil + CSS responsif untuk `columns` (stack di bawah 768px)). Style blok dirender sebagai atribut `style` inline dari whitelist. Escape semua teks/atribut, sanitasi URL (05 bagian 5.6). Tanpa `<script>`.
- **Selesai jika:** `renderHtml(createEmptyDocument())` menghasilkan HTML valid.

### Task 2.11: Route Handler export
- `src/app/api/pages/[pageId]/export/route.ts` (`GET`): `await params`, `requireUser`, rate limit 20/jam, muat page milik user, normalisasi + validasi, `renderHtml`, transaksi (snapshot EXPORT + `ExportLog`), respons dengan header 05 bagian 5.6 butir 8. Error → JSON `{ error: { code, message } }` dengan status HTTP sesuai (401/404/429/500).
- **Selesai jika:** akses tanpa login → 401; page orang lain → 404.

### Task 2.12: Template & Admin: service dan actions
- `template-repository.ts`, `template-service.ts`: `listActiveTemplates`, admin `createTemplate`, `updateTemplate`, `toggleTemplate` (validasi konten dengan schema dokumen). `user-admin-service.ts`: `listUsers({ query, page })`, `changeRole`, `setActive` (aturan admin terakhir, 05 bagian 5.1). Semua action memanggil `requireAdmin()`.
- **Selesai jika:** admin tidak dapat menonaktifkan dirinya sendiri.

### Task 2.13: Health check
- `src/app/api/health/route.ts` sesuai 05 bagian 5.11.
- **Selesai jika:** `GET /api/health` mengembalikan `{ status: "ok" }`.

---

## FASE 3: Frontend / UI

> Semua komponen **mobile-first** (04 bagian 4.8). Teks Bahasa Indonesia.

### Task 3.1: Design tokens & komponen UI dasar
- `globals.css` (Tailwind v4, variabel warna, font sistem). Komponen di `components/ui/`: `Button` (varian primary/secondary/danger/ghost, ukuran, state loading), `Input`, `Label`, `Textarea`, `Select`, `Card`, `Dialog` (berbasis elemen `<dialog>`, tutup dengan Esc), `Spinner`, `FormError`, `Badge`. Pasang `<Toaster />` dari `sonner` di root layout.
- **Selesai jika:** semua komponen ter-render di halaman uji sementara (hapus setelah verifikasi).

### Task 3.2: Layout publik & Home
- `app/(marketing)/layout.tsx` (navbar responsif dengan menu hamburger di mobile, footer), `app/(marketing)/page.tsx`: hero, 3 fitur, cara kerja 3 langkah, CTA. Tombol menyesuaikan status login (`getOptionalUser`).
- **Selesai jika:** tampilan rapi pada 360px dan 1280px.

### Task 3.3: Halaman Register & Login
- `app/(auth)/register/page.tsx`, `app/(auth)/login/page.tsx` + komponen form client dengan `useActionState`, error per field, pesan umum `aria-live`. User yang sudah login diredirect ke `/dashboard`. Login membaca `callbackUrl` dari `searchParams` (await).
- **Selesai jika:** alur register → dashboard dan login → dashboard bekerja; error validasi tampil per field.

### Task 3.4: `proxy.ts` dan layout area terproteksi
- `src/proxy.ts`: jika tidak ada cookie session pada path `/dashboard`, `/editor`, `/admin` → redirect `/login?callbackUrl=...`; jika ada cookie dan path `/login` atau `/register` → redirect `/dashboard`. Matcher tepat.
- `app/(app)/layout.tsx`: `requireUser` (redirect `/login` bila gagal), navbar dengan nama user, link Admin (jika admin), tombol logout. `app/admin/layout.tsx`: `requireAdmin`.
- **Selesai jika:** akses `/dashboard` tanpa login → redirect ke login; USER mengakses `/admin/users` → `notFound()`.

### Task 3.5: Dashboard: daftar project
- `app/(app)/dashboard/page.tsx` (Server Component): grid kartu project (1 kolom mobile, 2 `md`, 3 `lg`), empty state, dialog "Project Baru", menu rename/hapus (konfirmasi dialog). `loading.tsx`.
- **Selesai jika:** CRUD project bekerja dan UI memperbarui tanpa reload manual (`revalidatePath`).

### Task 3.6: Halaman project: daftar page
- `app/(app)/dashboard/projects/[projectId]/page.tsx` (await params): tabel/daftar page (kartu di mobile), tombol "Page Baru" → dialog pilih "Kosong" atau template, aksi rename, duplikat, hapus, buka editor.
- **Selesai jika:** membuat page dari template menghasilkan page dengan blok awal template.

### Task 3.7: Editor: registry blok dan operasi pohon
- `features/editor/blocks/registry.ts` (14 blok, 04 bagian 4.9 butir 4) dan `features/editor/lib/tree.ts`: `insertBlock`, `moveBlock`, `removeBlock`, `cloneBlock`, `updateProps`, `updateStyle`, `findParentId`, `isDescendant`. Fungsi murni, validasi aturan struktur.
- **Selesai jika:** typecheck lolos (test di Task 4.7).

### Task 3.8: Editor: Zustand store
- `features/editor/store/editor-store.ts`: state dan aksi 04 bagian 4.9 (document, selectedId, viewport, saveStatus, revision, history 50 langkah, `undo`, `redo`, `markSaved`, `setSaveStatus`, `isDirty`).
- **Selesai jika:** typecheck lolos.

### Task 3.9: Editor: shell layout
- `app/editor/[pageId]/page.tsx` (Server Component: await params, `getPageForEditor`, `notFound()` jika tidak ada; handle konten rusak 05 bagian 5.9) merender `<EditorShell initialDocument initialRevision pageMeta />` (client). Layout 3 panel; di bawah 1024px tampilkan pesan pengganti. Toolbar atas (placeholder tombol).
- **Selesai jika:** `/editor/<id>` menampilkan 3 panel kosong dan toolbar.

### Task 3.10: Editor: Palette dan kanvas (render)
- `Palette` (daftar blok dari registry, kategori: Layout, Konten, Komponen). `Canvas` merender pohon blok dengan renderer React per tipe, area kanvas mengikuti `viewport` (100%/768px/375px), seleksi blok dengan outline, label tipe blok pada blok terpilih.
- **Selesai jika:** dokumen dari template tampil benar di kanvas dan klik memilih blok.

### Task 3.11: Editor: Drag & drop
- `DndContext` dari `@dnd-kit/core`. Draggable: item palette (buat blok baru via `insertBlock`) dan blok kanvas (via `moveBlock`). Droppable: dalam container (append) dan celah antar sibling (indeks). Overlay drag, indikator drop valid/tidak valid sesuai `allowedChildren`. Dukung sensor mouse, touch, dan keyboard.
- **Selesai jika:** bisa menarik Heading dari palette ke container, mengurutkan ulang dengan drag, menolak drop `column` di luar `columns`.

### Task 3.12: Editor: Inspector (panel properti)
- Form dinamis berdasarkan `propsSchema` registry: input teks, select level heading, URL, daftar item navbar (tambah/hapus). Editor style: warna (input color + teks), ukuran, padding/margin, alignment, dll. dari whitelist. Update ke store (debounce ringan tidak perlu; update langsung).
- **Selesai jika:** mengubah teks heading dan warna latar langsung terlihat di kanvas.

### Task 3.13: Editor: Toolbar blok dan shortcut
- Toolbar mengambang pada blok terpilih: duplikat, hapus, naik, turun. Shortcut: `Delete` hapus, `Ctrl+Z` undo, `Ctrl+Shift+Z`/`Ctrl+Y` redo, `Ctrl+S` simpan, `Ctrl+D` duplikat (abaikan saat fokus di input).
- **Selesai jika:** semua shortcut bekerja dan tidak aktif saat mengetik di input.

### Task 3.14: Panel Admin
- `app/admin/users/page.tsx` (tabel user, pencarian via `searchParams`, pagination 20/halaman, aksi ubah role dan aktif/nonaktif via action) dan `app/admin/templates/page.tsx` (daftar, buat dengan textarea JSON tervalidasi, edit, toggle aktif).
- **Selesai jika:** admin dapat mengubah role user lain dan mendapat error ramah jika JSON template tidak valid.

### Task 3.15: Error boundary & not found
- `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `error.tsx` + `loading.tsx` untuk `(app)`, `editor`, `admin`.
- **Selesai jika:** `notFound()` menampilkan halaman 404 Indonesia.

### Task 3.16: Perbaikan posisi dialog (admin)
- **Masalah:** dialog admin tampil di pojok kiri atas, bukan di tengah layar.
- **Penyebab:** preflight Tailwind v4 menetapkan `margin: 0` pada semua elemen, menghapus `margin: auto` bawaan `<dialog>` sehingga modal tidak terpusat.
- **Perbaikan:** tambahkan `m-auto` pada className elemen `<dialog>` di `components/ui/dialog.tsx`, plus `max-h-[90vh] overflow-y-auto` agar konten panjang tetap dapat digulir di dalam viewport.
- **Selesai jika:** dialog di `/admin/users` dan `/admin/templates` muncul di tengah pada desktop dan mobile, dan konten panjang dapat digulir.

### Task 3.17: Perbaikan drag & drop editor
- **Masalah:** blok dari palette tidak bisa ditarik ke kanvas.
- **Penyebab:** `DndContext` hanya membungkus `Canvas`, sedangkan item palette memakai `useDraggable` di luar context; target drop juga hanya berupa celah tipis 6px sehingga sulit dikenai.
- **Perbaikan:** angkat `DndContext` + `DragOverlay` ke `features/editor/components/dnd-provider.tsx` yang membungkus palette, kanvas, dan inspector. Setiap blok kini menjadi droppable (drop di atas container = append ke container; drop di atas blok non-container = sisipkan sebelum blok; drop di celah = posisi presisi). Celah diperbesar menjadi 8px dan menyala saat hover. Grip drag (`⋮⋮`) pada tiap blok selalu terlihat agar blok dapat dipindah tanpa harus menebak area hover.
- **Selesai jika:** blok bisa ditarik dari palette ke container kosong, dipindah antar container, diurutkan ulang, dan `column` hanya diterima di dalam `columns`.

---

## FASE 4: Integration & State

### Task 4.1: Autosave editor
- Hook `useAutosave`: subscribe `isDirty`, debounce 2 detik, panggil `savePageContentAction({ pageId, content, baseRevision })`; antrian satu request in-flight; retry eksponensial 3x; perbarui `revision` dan status (`Menyimpan...`, `Tersimpan`, `Gagal menyimpan`); `Ctrl+S` memaksa simpan segera; `beforeunload` saat dirty (05 bagian 5.10).
- **Selesai jika:** mengubah teks lalu menunggu 2 detik menyimpan ke DB (verifikasi di `db:studio`); `revision` bertambah.

### Task 4.2: Penanganan konflik revisi dan sesi berakhir
- Dialog konflik tiga opsi (05 bagian 5.4) dan dialog sesi berakhir (05 bagian 5.1) pada alur autosave. Autosave berhenti saat dialog muncul.
- **Selesai jika:** membuka page di dua tab, menyimpan di tab A lalu mengedit di tab B memunculkan dialog konflik di tab B.

### Task 4.3: Riwayat versi di editor
- Tombol "Riwayat" membuka panel/dialog: daftar versi (waktu relatif, sumber), tombol "Simpan Versi" (snapshot manual), "Restore" (konfirmasi) → setelah sukses muat ulang dokumen dan revision ke store, reset history undo.
- **Selesai jika:** restore mengembalikan konten lama dan membuat snapshot `RESTORE`.

### Task 4.4: Export & download
- Tombol "Export": jika dirty, simpan dulu (tunggu selesai) lalu navigasi unduhan ke `/api/pages/{id}/export` (gunakan `fetch` + blob + `a[download]` agar error JSON dapat ditampilkan sebagai toast; tombol `disabled` saat proses). Tangani 401/404/429/500 dengan pesan Indonesia.
- **Selesai jika:** file `{slug}.html` terunduh dan dapat dibuka di browser dengan tampilan sama seperti kanvas.

### Task 4.5: Preview
- `app/editor/[pageId]/preview/page.tsx`: muat page milik user, `renderHtml`, tampilkan `<iframe sandbox="" srcDoc=...>` penuh layar + tombol kembali. Dari editor, tombol "Preview" menyimpan dulu bila dirty.
- **Selesai jika:** preview menampilkan hasil yang sama dengan export.

### Task 4.6: Header keamanan & konfigurasi
- `next.config.ts`: security headers (05 bagian 5.6 butir 7), `serverActions.bodySizeLimit: "2mb"`.
- **Selesai jika:** `curl -I http://localhost:3000` menampilkan header yang diharapkan.

### Task 4.7: Unit test
Buat test `vitest` minimal:
1. `tree.test.ts`: insert, move, remove, clone; tolak siklus; tolak `column` di luar `columns`; tolak anak pada non-container.
2. `document.test.ts`: dokumen kosong valid; tolak `javascript:` pada href; tolak style berbahaya; tolak > 500 blok; tolak orphan.
3. `render-html.test.ts`: teks berisi `<script>alert(1)</script>` ter-escape; output tidak mengandung `<script`; href `javascript:` menjadi `#`.
4. `slug.test.ts`: judul beraksen, simbol, kosong.
- **Selesai jika:** `npm test` hijau.

### Task 4.8: Audit akhir dan build
- Telusuri checklist 05 bagian 5.12 (gunakan `grep` untuk `dangerouslySetInnerHTML`, `$queryRawUnsafe`, `prisma.` di luar repositories, `from "@/server` di file `"use client"`).
- Jalankan `npm run typecheck && npm run lint && npm test && npm run build`.
- Tulis `README.md` di root: prasyarat, setup (`.env`, migrate, seed), perintah dev, akun admin seed.
- **Selesai jika:** semua perintah lolos dan checklist tercentang.

---

## Ringkasan Definisi Selesai (Definition of Done) MVP

1. User dapat register, login, logout.
2. User membuat project dan page (kosong/template), mengedit dengan drag & drop, autosave berjalan.
3. Undo/redo, preview, riwayat versi, dan export HTML berfungsi.
4. Admin dapat mengelola user dan template.
5. Semua test lolos dan `npm run build` sukses.
