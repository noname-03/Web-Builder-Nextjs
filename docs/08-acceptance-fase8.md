# Acceptance Fase 8: Provider Onboarding, Publish, dan Conversion UX

Status: **SELESAI & TERVERIFIKASI** (2026-11-06).

## Matriks

| Fitur | Kasus | Expected | Hasil |
|---|---|---|---|
| Provider onboarding (8.1) | key/URL valid | Cek koneksi sukses, baru disimpan terenkripsi | Lulus — submit memanggil `testProviderDraftAction` lebih dulu; row baru muncul setelah tes sukses; ciphertext `v1:` |
| Provider onboarding (8.1) | key invalid / URL invalid / timeout | Tidak ada row baru, pesan actionable | Lulus — error ditampilkan inline, `AiProvider` tidak dibuat |
| Provider onboarding (8.1) | edit tanpa key baru | Memakai key lama server-side untuk cek | Lulus — `testProviderDraft` mendekripsi key tersimpan bila `apiKey` kosong + `providerId` |
| Model discovery (8.8) | `GET /models` sukses | Model unik, terurut, maks 100 | Lulus — mock mengembalikan 3 model; UI menampilkan `gpt-4o-mini`, `llama-local`, `mock-model` terurut |
| Model discovery (8.8) | 404/405 | Hint non-blocking, model manual tetap bisa | Lulus — unit test + pesan "Provider tidak menyediakan daftar model otomatis" |
| Model discovery (8.8) | 401/429/500/timeout/redirect | Error terpetakan, key tidak bocor | Lulus — 7 unit test `models-client.test.ts` |
| Panel editor (8.2) | toggle kiri/kanan/keduanya | Label "Terbuka/Tersembunyi" jelas, kanvas melebar | Lulus — label "Blok TERBUKA" / "Properti TERSEMBUNYI", `data-testid` tersedia |
| Panel editor (8.2) | reload | Preferensi `localStorage` bertahan | Lulus — state disimpan di `wb:editor-panels` |
| Panel editor (8.2) | keduanya tersembunyi | Tombol floating restore muncul | Lulus — "Tampilkan panel blok" dan "Tampilkan panel properti" muncul |
| Home (8.3) | 360/768/1280px | Tanpa overflow, hierarki rapi, CTA valid | Lulus — agent melaporkan `scrollWidth === clientWidth` pada 360/768/1280 |
| Home (8.3) | konten | Menjelaskan AI, provider sendiri, template, export/publish, keamanan | Lulus — hero, AI flow, provider, editor, template, export/publish, security, use case, FAQ, CTA |
| Export menu (8.4) | Download HTML | File `{slug}.html` terunduh | Lulus — menu "Download HTML" memakai handler lama |
| Export menu (8.4) | Publish | URL `/pages/<slug>` tampil dan dapat disalin | Lulus — dialog menampilkan `http://localhost:3000/pages/publish-smoke-page` + tombol Salin URL |
| Publish (8.4) | draft/deleted/slug tidak dikenal | HTTP 404, tidak membocorkan draft | Lulus — slug tidak dikenal 404; draft 404 |
| Publish (8.4) | unpublish | URL publik kembali 404 | Lulus — `is_published=false` lalu URL 404 |
| Publish (8.4) | user lain publish page | `NOT_FOUND` | Lulus — `publishPageRecord` memfilter `userId` |
| Template gallery (8.5) | picker 360/1280px | Kartu visual, kategori, thumbnail, selection benar | Lulus — 11 kartu (kosong + 10), 11 thumbnail `role="img"`, kategori tampil |
| Template gallery (8.5) | quality gate | Semua template lolos, tanpa placeholder/script | Lulus — `checkTemplateLibrary(SEED_TEMPLATES) === []`, 10 test |
| Template gallery (8.5) | admin list | Kategori, featured, thumbnail tampil | Lulus — kolom Template berisi thumbnail + badge |
| Security | public page dengan dokumen berbahaya | Output tetap escaped, tanpa `<script>` | Lulus — render HTML publik tanpa `<script`, header `nosniff` |
| Regression | login/dashboard/editor/autosave/export | Semua alur lama tetap bekerja | Lulus — 106 unit test + verifikasi browser |
| CI | typecheck/lint/test/build | Hijau | Lulus — `tsc`, `eslint`, 106 test, `next build` |

## Bukti perintah

```
npx tsc --noEmit        -> 0 error
npx eslint .            -> 0 error
npx vitest run          -> 14 files, 106 tests passed
npm run build           -> sukses, route /pages/[slug] terdaftar
```

## Bukti browser

- Provider: dialog "Cek & Simpan Provider" menjalankan tes (mock `localhost:9999`) sebelum insert; row DB `Mock Local` muncul dengan `api_key_encrypted` berawalan `v1:`; provider pengguna `9Router` tidak tersentuh.
- Model: tombol "Ambil daftar model" mengisi datalist dengan 3 model mock, terurut.
- Panel: toggle menampilkan status `TERBUKA`/`TERSEMBUNYI` dan tombol restore floating saat keduanya disembunyikan.
- Publish: halaman uji → publish → `GET /pages/publish-smoke-page` = 200 dengan konten, tanpa `<script>`; unpublish → 404.
- Template: dialog Page Baru menampilkan 11 kartu dengan thumbnail dan kategori.

## Catatan

- Publish memakai `publicSlug` global unik; rename page setelah publish tidak mengubah URL sampai publish ulang.
- Provider lokal `http://localhost` hanya diizinkan saat development; build produksi memerlukan HTTPS.
- Model list opsional; provider tanpa endpoint `/models` tetap bisa memakai model manual.
- Data uji (halaman publish sementara dan provider mock) sudah dihapus setelah verifikasi.
