# 5. Edge Cases & Security Considerations

Setiap butir berikut adalah **requirement**, bukan saran.

## 5.1 Autentikasi & Session

| Skenario | Penanganan |
|---|---|
| Penyimpanan password | `bcryptjs` cost 12. Password min 8 karakter, maks 72 (batas bcrypt), wajib ada huruf dan angka. |
| Token session | 32 byte acak (`crypto.randomBytes(32).toString("base64url")`). Cookie berisi token mentah; DB hanya menyimpan SHA-256 hex (`tokenHash`). |
| Cookie | `httpOnly: true`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`, `path: "/"`, `maxAge` = TTL. |
| **Token expired** | `getSession()` mencari session dengan `tokenHash` dan `expiresAt > now()`. Tidak ketemu → hapus cookie, perlakukan sebagai GUEST. Di halaman `(app)`: redirect `/login?callbackUrl=<path>`. Di Server Action: kembalikan `UNAUTHENTICATED`; client menampilkan toast "Sesi berakhir" dan redirect ke `/login`. Di editor: simpan perubahan lokal ke memori, tampilkan dialog "Sesi berakhir, masuk lagi" yang membuka `/login` di tab baru, dan tombol "Coba simpan lagi" (jangan hilangkan perubahan). |
| Sliding expiration | Jika sisa umur session < 50% TTL, perpanjang `expiresAt` dan set ulang cookie (hanya di Server Action/Route Handler, karena cookie tidak bisa di-set saat render Server Component). |
| User dinonaktifkan | `getSession()` join user; jika `isActive = false` → hapus semua session user, anggap GUEST. Login ditolak dengan pesan generik. |
| Enumerasi user | Pesan login gagal selalu "Email atau password salah". Waktu respons disamakan: jika email tidak ada, tetap jalankan `bcrypt.compare` terhadap hash dummy. Register dengan email terdaftar → `CONFLICT` "Email sudah terdaftar" (diterima untuk MVP). |
| Brute force | Cek `login_attempts`: jika >= 5 gagal untuk (email, IP) dalam 15 menit → `RATE_LIMITED` (pesan: "Terlalu banyak percobaan. Coba lagi dalam 15 menit."). Login sukses menghapus catatan gagal untuk kombinasi itu. |
| Fixation | Selalu buat session baru saat login; hapus session lama jika cookie lama ada. |
| Logout | Hapus baris session di DB + hapus cookie. Idempotent (tidak error jika session sudah hilang). |
| Open redirect | `callbackUrl` hanya diterima jika diawali `/` dan **tidak** diawali `//` atau `/\`; selain itu pakai `/dashboard`. |
| Ganti role/nonaktifkan | Admin tidak boleh mengubah dirinya sendiri. Pastikan selalu ada minimal satu ADMIN aktif (cek dalam transaksi). |

## 5.2 Otorisasi

1. Guard di `server/auth/guards.ts`: `requireUser()`, `requireAdmin()`. Dipanggil di **awal setiap** Server Action, Route Handler, dan layout area terproteksi. `proxy.ts` hanya optimasi, bukan batas keamanan.
2. **IDOR:** semua query data user wajib menyertakan kepemilikan (`project: { userId }` atau `userId`). Data bukan milik → `NOT_FOUND`.
3. Jangan percaya `userId`/`role` dari input client; ambil dari session.
4. Aksi admin diverifikasi `role === ADMIN` di server pada setiap pemanggilan.

## 5.3 Double Submission

| Lapisan | Penanganan |
|---|---|
| UI | Tombol submit `disabled` selama `pending` (`useFormStatus`/`useActionState`). |
| Register | Unique index `users.email` + tangkap `P2002` → `CONFLICT`. Dua klik cepat menghasilkan satu akun dan satu error ramah. |
| Buat project/page | Unique partial index (nama project, slug page). Slug bentrok saat membuat → service otomatis menambahkan sufiks `-2`, `-3`, ... (maks 20 percobaan dalam transaksi, jika tetap gagal → `CONFLICT`). |
| Autosave editor | Satu request in-flight pada satu waktu (antrian di client). Perubahan saat request berjalan ditandai `dirty` dan disimpan setelah request selesai. |
| Export | Tombol `disabled` saat mengunduh. Rate limit 20/jam/user dihitung dari `export_logs`. |
| Restore versi | Dikunci oleh optimistic locking (`revision`) sehingga restore ganda tidak menimpa diam-diam. |

## 5.4 Optimistic Locking (Konflik Edit Dua Tab)

`savePageContent({ pageId, content, baseRevision })`:

```ts
const result = await tx.page.updateMany({
  where: { id: pageId, revision: baseRevision, deletedAt: null, project: { userId } },
  data: { content, revision: { increment: 1 } },
});
if (result.count === 0) throw new AppError("REVISION_CONFLICT", "Page diubah di tempat lain.");
```

- Sukses → kembalikan `revision` baru; client memperbarui `revision` di store.
- `REVISION_CONFLICT` → client menghentikan autosave dan menampilkan dialog dengan tiga pilihan: **"Muat versi terbaru"** (buang perubahan lokal), **"Timpa dengan versi saya"** (kirim ulang dengan `baseRevision` = revision terbaru dari server, `force: true` hanya untuk pemilik), **"Simpan salinan sebagai page baru"**.
- Cek `count === 0` lalu bedakan `NOT_FOUND` vs conflict dengan satu `findFirst` setelahnya.

## 5.5 Transaksi & Rollback

Semua operasi berikut **wajib** dalam satu `prisma.$transaction` (gagal sebagian = rollback total):

| Operasi | Langkah dalam transaksi |
|---|---|
| Register | buat user → buat session |
| Save page | update page (dengan cek revision) → (opsional) buat snapshot MANUAL → pangkas versi > 30 |
| Export | buat snapshot EXPORT → buat `ExportLog` → pangkas versi |
| Restore | snapshot kondisi sekarang (`RESTORE`) → timpa `content` dan `revision + 1` |
| Duplikat page | baca page → buat page baru dengan slug unik |
| Ubah role admin | hitung ADMIN aktif → update (tolak jika tersisa 0) |
| Hapus project | set `deletedAt` project (page ikut tersembunyi lewat filter relasi) |

Aturan: error di dalam transaksi dilempar ke luar sehingga Prisma otomatis rollback; **jangan** menelan error di dalam callback transaksi. Set `maxWait: 5000`, `timeout: 10000`.

**Export (Route Handler):** render HTML dilakukan **sebelum** transaksi DB (CPU, bukan IO). Jika transaksi gagal → respons 500 JSON `{ error }`, tidak ada file yang diunduh dan tidak ada `ExportLog`.

## 5.6 Keamanan Konten (XSS & Injeksi)

1. **Escape HTML** semua teks dan atribut di `render-html.ts` (`& < > " '`). Tidak ada `dangerouslySetInnerHTML` di editor.
2. **Sanitasi URL** (`props.href`, `props.src`, item navbar): izinkan hanya `https:`, `http:`, `mailto:`, `tel:`, `#...`, `/...` (bukan `//...`). Selain itu ganti dengan `#`. Dilakukan di **validasi Zod (server)** dan **renderer export** (dua lapis).
3. **Sanitasi style:** hanya key whitelist; nilai harus lolos regex `^[#a-zA-Z0-9%.,\s()\-/]+$` dan tidak mengandung `url(`, `expression(`, `javascript:`, `@import`. Nilai tidak lolos → properti dibuang.
4. Tidak ada blok script/embed/iframe pada MVP. Output export **tidak mengandung `<script>`**.
5. Preview memakai `<iframe sandbox="" srcdoc=...>` (tanpa `allow-scripts`, tanpa `allow-same-origin`).
6. Tipe blok, id, dan key props divalidasi dengan Zod `strict()`; key tak dikenal ditolak.
7. Header keamanan di `next.config.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (kecuali jika route preview memakai iframe internal sandbox; iframe srcdoc tidak terpengaruh), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
8. Route export: `Content-Type: text/html; charset=utf-8`, `Content-Disposition: attachment; filename="<slug>.html"` (nama file disanitasi `[a-z0-9-]`), `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`.

## 5.7 CSRF

Server Actions Next.js sudah memeriksa `Origin` vs `Host`. Cookie `SameSite=Lax`. Route Handler export bersifat `GET` yang **tidak mengubah state penting** selain log; tetap wajib auth. Jangan membuat Route Handler mutasi dengan `GET`.

## 5.8 Validasi Input & Batas

| Input | Batas |
|---|---|
| Nama user | 2-100 karakter, trim |
| Email | format valid, maks 255, lowercase + trim |
| Nama project | 1-100 |
| Judul page | 1-150 |
| Slug | `^[a-z0-9]+(-[a-z0-9]+)*$`, maks 100; auto-generate dari judul bila kosong; fallback `halaman` |
| Content JSON | maks 1 MB, maks 500 blok, kedalaman 12 |
| Teks blok | maks 5000 karakter |

Server Action memeriksa ukuran payload `JSON.stringify(content).length` sebelum Zod parse berat. Konfigurasi `experimental.serverActions.bodySizeLimit = "2mb"` di `next.config.ts`.

## 5.9 Dokumen Korup & Versi Schema

- Saat memuat page, `content` di-parse dengan Zod. Jika **gagal**: editor tidak crash; tampilkan halaman error dengan pesan "Konten page rusak" dan tombol "Pulihkan dari versi terakhir" (restore `PageVersion` terbaru yang valid) serta "Reset ke halaman kosong".
- `content.version` dipakai untuk migrasi di masa depan; buat fungsi `migrateDocument(raw)` (saat ini hanya meneruskan versi 1).
- Page baru dengan `content = {}` (default DB) diperlakukan sebagai dokumen kosong (lihat 02 bagian 2.4) lewat `normalizeDocument()`.

## 5.10 Ketahanan Client Editor

| Skenario | Penanganan |
|---|---|
| Offline / jaringan putus saat autosave | Status "Gagal menyimpan", retry otomatis eksponensial (2s, 4s, 8s, maks 3x), lalu tombol manual. Perubahan tidak hilang dari memori. |
| Tutup tab dengan perubahan belum tersimpan | `beforeunload` konfirmasi. |
| Undo setelah save | Diizinkan; undo menghasilkan perubahan baru (dirty) yang akan disimpan ulang. |
| Hapus blok yang sedang dipilih | `selectedId` dikembalikan ke `null` atau parent. |
| Drop blok ke dalam turunannya sendiri | Ditolak (cek siklus pada `moveBlock`). |
| Dokumen melebihi batas blok | Palette dinonaktifkan; toast "Batas 500 blok tercapai". |
| Payload > 1 MB | Tolak simpan dengan pesan jelas; tidak mengirim ke server. |

## 5.11 Error Handling Umum

- `app/error.tsx` dan `app/not-found.tsx` dengan UI Indonesia dan tombol kembali.
- `app/global-error.tsx` sebagai pengaman terakhir.
- Log server: `console.error("[<action>] <errorId>", error)`; **jangan** log password, token, atau konten page lengkap.
- Jangan pernah mengembalikan pesan error Prisma/stack trace ke client.
- `GET /api/health`: jalankan `SELECT 1`; sukses `200 { status: "ok" }`, gagal `503 { status: "down" }`.

## 5.12 Checklist Akhir Keamanan (Task 4.8 harus memverifikasi)

- [ ] Tidak ada query Prisma di luar `server/repositories`.
- [ ] Semua Server Action memanggil guard di baris pertama.
- [ ] Semua query Project/Page menyertakan filter kepemilikan dan `deletedAt: null`.
- [ ] Tidak ada `dangerouslySetInnerHTML`, `eval`, `$queryRawUnsafe`.
- [ ] Output export tidak berisi `<script`, `javascript:`, `onerror=`.
- [ ] `passwordHash`/`tokenHash` tidak pernah keluar dari layer server.
- [ ] `.env` ada di `.gitignore`.
- [ ] Cookie session `httpOnly`, `sameSite=lax`.

## 5.13 AI Provider (Prompt Builder)

| Area | Aturan |
|---|---|
| **Penyimpanan key** | API key dienkripsi AES-256-GCM (`iv` 12 byte, auth tag 16 byte, format `v1:<iv>:<tag>:<cipher>`). Kunci dari `ENCRYPTION_KEY` (32 byte base64). Dekripsi hanya dilakukan tepat sebelum request. |
| **Eksposur key** | Key/ciphertext tidak pernah dikirim ke client, tidak masuk `AiGeneration`, tidak masuk log, dan tidak muncul di pesan error. UI hanya menampilkan `••••` + 4 karakter terakhir. |
| **Rotasi kunci** | `npm run ai:reencrypt -- --dry-run` lalu tanpa `--dry-run`. Jika dekripsi gagal, minta user menyimpan ulang provider. |
| **SSRF** | `assertSafeBaseUrl` dijalankan saat simpan dan setiap request: hanya https (kecuali localhost di development), tanpa credential/query/fragment, tanpa IP privat/metadata, redirect ditolak. |
| **Prompt injection** | Prompt user diperlakukan sebagai data dengan delimiter; hasil WAJIB JSON dokumen builder dan selalu melewati `sanitizeAiDocument` + `parseDocument`. Tidak ada `eval`, HTML mentah, atau `dangerouslySetInnerHTML`. |
| **Output sanitization** | Style di luar whitelist dibuang, gradient/URL diverifikasi ulang, id duplikat/tidak valid diregenerasi, font tidak aman dibuang, maksimal 500 blok. |
| **Rate limit & biaya** | Generate maks `AI_RATE_LIMIT_PER_HOUR` per user per jam (dihitung dari `ai_generations`). Tes koneksi maks 10/jam. `maxTokens` dibatasi 256–32000. |
| **Concurrency** | Satu generate aktif per `userId+pageId`; permintaan kedua mendapat `CONFLICT`. Tombol UI disabled saat proses berjalan. |
| **Timeout** | `AI_REQUEST_TIMEOUT_MS` (default 60 detik) memakai `AbortController`. Tidak ada dokumen setengah jadi yang disimpan. |
| **Konflik revisi** | Pratinjau menampilkan peringatan jika `revision` halaman berubah sejak permintaan dibuat; penerapan tetap atas konfirmasi user. |
| **Retensi** | `AiGeneration` menyimpan prompt terpotong (maks 4000 karakter), tanpa respons mentah. `npm run ai:cleanup` menghapus data > 90 hari. User dapat menghapus riwayat dari panel AI. |
| **Isolasi** | Semua query provider/generation memfilter `userId`; akses data user lain → `NOT_FOUND`. |

Checklist verifikasi: key tidak muncul di log/respons, ciphertext berformat `v1:`, SSRF ditolak, output AI selalu valid, double submit dicegah, dan `npm run typecheck && npm run lint && npm test && npm run build` hijau.
