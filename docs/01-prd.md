# 1. Product Requirement Document (PRD)

## 1.1 Tujuan Produk

Pengguna dapat membuat halaman web statis lewat editor visual drag & drop tanpa coding, menyimpan proyeknya di akun, dan mengunduh hasilnya sebagai file HTML siap pakai.

## 1.2 Scope MVP

**In scope**
- Landing page (Home) publik
- Register, login, logout
- Dashboard: daftar project dan page
- Editor drag & drop (blok, properti, style dasar, undo/redo, autosave)
- Riwayat versi page (snapshot manual dan otomatis saat export)
- Template bawaan (dikelola Admin)
- Export dan download HTML
- Preview page
- Panel Admin: kelola user dan template

**Out of scope (jangan dikerjakan)**
- Upload file/gambar, hosting/publish ke domain, kolaborasi realtime, pembayaran, OAuth/social login, verifikasi email, multi-bahasa, custom JavaScript/embed script di blok

## 1.3 User Roles & Permissions

| Role | Deskripsi |
|---|---|
| `GUEST` | Belum login |
| `USER` | Pengguna terdaftar (default saat register) |
| `ADMIN` | Pengelola sistem |

| Aksi | GUEST | USER | ADMIN |
|---|:-:|:-:|:-:|
| Lihat Home | Ya | Ya | Ya |
| Register / Login | Ya | n/a | n/a |
| Lihat dashboard sendiri | Tidak | Ya | Ya |
| CRUD project milik sendiri | Tidak | Ya | Ya |
| CRUD page milik sendiri | Tidak | Ya | Ya |
| Gunakan editor di page milik sendiri | Tidak | Ya | Ya |
| Export HTML page milik sendiri | Tidak | Ya | Ya |
| Lihat/restore versi page milik sendiri | Tidak | Ya | Ya |
| Membuat page dari template | Tidak | Ya | Ya |
| Lihat daftar semua user | Tidak | Tidak | Ya |
| Ubah role / nonaktifkan user | Tidak | Tidak | Ya |
| CRUD template | Tidak | Tidak | Ya |
| Akses data milik user lain | Tidak | Tidak | **Tidak** (Admin tidak membuka project user lain) |

**Aturan kepemilikan:** setiap query ke `Project`, `Page`, `PageVersion` wajib menyertakan filter `userId` milik session. Jika data tidak ditemukan atau bukan milik user, kembalikan `NOT_FOUND` (bukan `FORBIDDEN`) agar tidak membocorkan keberadaan data.

## 1.4 Core Features dan User Flow

### F1. Home (Landing Page)
Halaman publik `/`: hero, fitur singkat, tombol "Mulai Gratis" (ke `/register`) dan "Masuk" (ke `/login`). Jika sudah login, tombol berubah menjadi "Buka Dashboard".

### F2. Autentikasi
- **Register:** `/register` → isi nama, email, password, konfirmasi password → akun `USER` dibuat → otomatis login → redirect `/dashboard`.
- **Login:** `/login` → email + password → set cookie session → redirect ke `callbackUrl` aman (path internal) atau `/dashboard`.
- **Logout:** tombol di navbar dashboard → hapus session di DB dan cookie → redirect `/`.
- Rate limit login: maksimal 5 percobaan gagal per 15 menit per kombinasi email+IP.

### F3. Dashboard & Project
- `/dashboard`: daftar project (kartu), tombol "Project Baru".
- Buat project: nama (wajib), deskripsi (opsional).
- Rename, hapus project (soft delete, konfirmasi dialog).
- `/dashboard/projects/[projectId]`: daftar page di project, tombol "Page Baru" (kosong atau dari template).
- Page: judul, slug unik per project, status `DRAFT`/`READY`. Bisa rename, duplikat, hapus (soft delete).

### F4. Editor Drag & Drop
Rute: `/editor/[pageId]`. Layout tiga panel:
1. **Kiri: Palette blok.** Drag blok ke kanvas.
2. **Tengah: Kanvas.** Render pohon blok. Pilih blok dengan klik. Urutkan/pindah blok dengan drag. Ada toggle viewport: Desktop / Tablet / Mobile (lebar kanvas 100% / 768px / 375px).
3. **Kanan: Panel properti.** Edit teks, link, src gambar, dan style blok terpilih.

Atas: nama page, tombol Undo, Redo, Simpan (dengan indikator status), Preview, Export, Riwayat Versi.

**Daftar blok MVP:**

| Tipe | Container? | Props utama |
|---|:-:|---|
| `section` | Ya | (style saja) |
| `container` | Ya | maxWidth |
| `columns` | Ya (anak harus `column`) | jumlah kolom 1-4, gap |
| `column` | Ya | (style saja) |
| `heading` | Tidak | text, level (1-6) |
| `text` | Tidak | text |
| `image` | Tidak | src (https), alt |
| `button` | Tidak | text, href |
| `link` | Tidak | text, href |
| `divider` | Tidak | (style saja) |
| `spacer` | Tidak | height |
| `navbar` | Tidak | brand, items (array {label, href}) |
| `hero` | Tidak | title, subtitle, buttonText, buttonHref |
| `footer` | Tidak | text |

**Style yang dapat diedit** (whitelist): `color`, `backgroundColor`, `fontSize`, `fontWeight`, `textAlign`, `padding`, `margin`, `borderRadius`, `border`, `width`, `maxWidth`, `minHeight`, `gap`, `display`, `flexDirection`, `justifyContent`, `alignItems`.

**Perilaku editor:**
- Undo/redo minimal 50 langkah (di memori).
- Autosave: debounce 2 detik setelah perubahan terakhir. Indikator: `Menyimpan...`, `Tersimpan`, `Gagal menyimpan` (dengan tombol coba lagi).
- Hapus blok dengan tombol Delete atau tombol di toolbar blok. Duplikasi dengan tombol di toolbar blok.
- Peringatan `beforeunload` jika ada perubahan belum tersimpan.
- Optimistic locking: simpan membawa `revision`. Jika tidak cocok, tampilkan dialog konflik (lihat dokumen 05).

### F5. Preview
`/editor/[pageId]/preview`: render HTML hasil export di `<iframe sandbox>` penuh layar, dengan tombol kembali ke editor.

### F6. Export & Download HTML
1. User klik "Export".
2. Server memvalidasi dokumen, merender HTML, menyimpan snapshot versi (`source = EXPORT`), mencatat `ExportLog`.
3. Browser mengunduh `{slug}.html` (header `Content-Disposition: attachment`).
4. Rate limit: 20 export per jam per user.

### F7. Riwayat Versi
Panel di editor: daftar snapshot (waktu, sumber: `MANUAL`/`EXPORT`/`RESTORE`). Aksi: "Restore" (menimpa konten saat ini; snapshot kondisi sekarang dibuat otomatis lebih dulu). Simpan maksimal 30 versi per page; yang tertua dihapus otomatis.

### F8. Template
User memilih template saat membuat page baru. Konten template disalin (deep copy) ke page baru. Admin mengelola template di `/admin/templates` (buat dari JSON, edit, aktif/nonaktif).

### F9. Panel Admin
- `/admin/users`: tabel user (pencarian email/nama, pagination 20/halaman), ubah role, aktif/nonaktif. Admin tidak dapat menonaktifkan atau menurunkan role dirinya sendiri.
- `/admin/templates`: CRUD template.

## 1.5 Peta Halaman (Route Map)

| Route | Akses | Keterangan |
|---|---|---|
| `/` | Publik | Home |
| `/login`, `/register` | Hanya GUEST (user login diredirect ke `/dashboard`) | Auth |
| `/dashboard` | USER, ADMIN | Daftar project |
| `/dashboard/projects/[projectId]` | USER, ADMIN (pemilik) | Daftar page |
| `/editor/[pageId]` | USER, ADMIN (pemilik) | Editor |
| `/editor/[pageId]/preview` | USER, ADMIN (pemilik) | Preview |
| `/admin/users` | ADMIN | Kelola user |
| `/admin/templates` | ADMIN | Kelola template |
| `GET /api/pages/[pageId]/export` | USER, ADMIN (pemilik) | Download HTML |
| `GET /api/health` | Publik | Health check |

## 1.6 Non-Functional Requirements

- **Mobile-first:** semua halaman aplikasi (kecuali editor) harus nyaman di 360px. Editor: di bawah 1024px tampilkan pesan "Gunakan layar lebih lebar untuk editor" dengan tombol kembali (editor dirancang desktop).
- **Performa:** halaman dashboard < 2 detik pada 100 page. Payload simpan editor maksimal 1 MB.
- **Aksesibilitas:** semua input punya `label`, tombol ikon punya `aria-label`, fokus terlihat.
- **Pesan error:** Bahasa Indonesia, tidak membocorkan detail internal.
