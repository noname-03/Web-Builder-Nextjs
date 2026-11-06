# 2. Database Design

PostgreSQL 15+, Prisma 6. Semua ID adalah **UUIDv7** (`@db.Uuid`, default `uuid_generate_v7()`), dibuat oleh fungsi PostgreSQL di migration `uuid_v7`. Semua waktu `timestamptz`.

Mengapa UUIDv7: tetap bertipe `uuid` (FK tidak berubah), tetapi 48 bit pertama adalah timestamp milik sehingga insert baru **sortable** dan lebih ramah index dibanding UUIDv4. Baris lama (UUIDv4) tetap valid; hanya baris baru yang memakai v7.

## 2.1 Prisma Schema (siap pakai)

Simpan sebagai `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum PageStatus {
  DRAFT
  READY
}

enum VersionSource {
  MANUAL
  EXPORT
  RESTORE
}

model User {
  id           String    @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  email        String    @unique @db.VarChar(255)
  name         String    @db.VarChar(100)
  passwordHash String    @map("password_hash") @db.VarChar(255)
  role         Role      @default(USER)
  isActive     Boolean   @default(true) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  sessions   Session[]
  projects   Project[]
  exportLogs ExportLog[]
  templates  Template[]

  @@index([role])
  @@index([isActive])
  @@map("users")
}

model Session {
  id         String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  tokenHash  String   @unique @map("token_hash") @db.VarChar(64)
  expiresAt  DateTime @map("expires_at") @db.Timestamptz(6)
  userAgent  String?  @map("user_agent") @db.VarChar(255)
  ipAddress  String?  @map("ip_address") @db.VarChar(45)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

model LoginAttempt {
  id        String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  email     String   @db.VarChar(255)
  ipAddress String   @map("ip_address") @db.VarChar(45)
  success   Boolean
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  @@index([email, ipAddress, createdAt])
  @@map("login_attempts")
}

model Project {
  id          String    @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  name        String    @db.VarChar(100)
  description String?   @db.VarChar(500)
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(6)
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  pages Page[]

  @@index([userId, deletedAt, updatedAt(sort: Desc)])
  @@map("projects")
}

model Page {
  id        String     @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  projectId String     @map("project_id") @db.Uuid
  title     String     @db.VarChar(150)
  slug      String     @db.VarChar(100)
  status    PageStatus @default(DRAFT)
  content   Json       @default("{}") @db.JsonB
  revision  Int        @default(1)
  deletedAt DateTime?  @map("deleted_at") @db.Timestamptz(6)
  createdAt DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  project    Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  versions   PageVersion[]
  exportLogs ExportLog[]

  @@index([projectId, deletedAt, updatedAt(sort: Desc)])
  @@map("pages")
}

model PageVersion {
  id        String        @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  pageId    String        @map("page_id") @db.Uuid
  content   Json          @db.JsonB
  revision  Int
  source    VersionSource
  createdAt DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)

  page Page @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId, createdAt(sort: Desc)])
  @@map("page_versions")
}

model Template {
  id          String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  name        String   @db.VarChar(100)
  description String?  @db.VarChar(300)
  content     Json     @db.JsonB
  isActive    Boolean  @default(true) @map("is_active")
  createdById String?  @map("created_by_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  createdBy User? @relation(fields: [createdById], references: [id], onDelete: SetNull)

  @@index([isActive])
  @@map("templates")
}

model ExportLog {
  id        String   @id @default(dbgenerated("uuid_generate_v7()")) @db.Uuid
  pageId    String   @map("page_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  revision  Int
  sizeBytes Int      @map("size_bytes")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  page Page @relation(fields: [pageId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@index([pageId])
  @@map("export_logs")
}
```

## 2.2 SQL Tambahan (Partial Unique Index dan Constraint)

Prisma tidak mendukung partial unique index. Setelah `prisma migrate dev --name init --create-only`, **edit file `migration.sql` yang dihasilkan** dan tambahkan di bagian akhir sebelum menjalankan `prisma migrate dev`:

```sql
-- Slug unik per project, hanya untuk page yang belum dihapus
CREATE UNIQUE INDEX "pages_project_id_slug_active_key"
  ON "pages" ("project_id", "slug")
  WHERE "deleted_at" IS NULL;

-- Nama project unik per user (case-insensitive), hanya yang belum dihapus
CREATE UNIQUE INDEX "projects_user_id_name_active_key"
  ON "projects" ("user_id", lower("name"))
  WHERE "deleted_at" IS NULL;

-- Email selalu disimpan lowercase
ALTER TABLE "users"
  ADD CONSTRAINT "users_email_lowercase_chk" CHECK ("email" = lower("email"));

-- Slug hanya huruf kecil, angka, dan strip
ALTER TABLE "pages"
  ADD CONSTRAINT "pages_slug_format_chk" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Revision positif
ALTER TABLE "pages"
  ADD CONSTRAINT "pages_revision_positive_chk" CHECK ("revision" >= 1);
```

> **UUIDv7:** default `uuid_generate_v7()` dibuat oleh fungsi PL/pgSQL di migration `20261106095350_uuid_v7` dan tidak memerlukan ekstensi. Fungsi menyusun 48-bit timestamp milidetik + 4-bit versi `7` + 62-bit acak, sehingga ID baru sortable dan tetap bertipe `uuid` (FK tidak berubah). Baris lama UUIDv4 tetap valid. Definisi fungsi ada di `prisma/migrations/20261106095350_uuid_v7/migration.sql`.

## 2.3 Ringkasan Relasi

```
User 1─* Session            (cascade)
User 1─* Project            (cascade)
Project 1─* Page            (cascade)
Page 1─* PageVersion        (cascade)
Page 1─* ExportLog          (cascade)
User 1─* ExportLog          (cascade)
User 1─* Template           (set null)
```

## 2.4 Format Dokumen Builder (`Page.content`, JSON)

Satu-satunya sumber kebenaran editor dan exporter. Struktur **pohon blok dengan map datar**:

```ts
type BlockType =
  | "section" | "container" | "columns" | "column"
  | "heading" | "text" | "image" | "button" | "link"
  | "divider" | "spacer" | "navbar" | "hero" | "footer";

type BuilderDocument = {
  version: 1;
  rootId: string;
  blocks: Record<string, Block>;
  meta: { title: string; description?: string; lang: string };
};

type Block = {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  style: Record<string, string>;
  children: string[];
};
```

Contoh dokumen kosong (dipakai saat membuat page baru):

```json
{
  "version": 1,
  "rootId": "root",
  "blocks": {
    "root": {
      "id": "root",
      "type": "container",
      "props": { "maxWidth": "1200px" },
      "style": { "padding": "16px" },
      "children": []
    }
  },
  "meta": { "title": "Halaman Baru", "lang": "id" }
}
```

**Aturan dokumen (divalidasi Zod di server):**
- `rootId` wajib ada di `blocks`; blok root bertipe `container` dan tidak bisa dihapus.
- Semua id di `children` harus ada di `blocks`; tidak boleh ada siklus; tiap blok punya maksimal satu parent.
- Blok non-container harus `children: []`.
- `column` hanya boleh menjadi anak `columns`; `columns` hanya boleh berisi `column`.
- Maksimal 500 blok, kedalaman maksimal 12, ukuran JSON maksimal 1 MB.
- Key `style` hanya dari whitelist (lihat PRD 1.4); nilai maksimal 100 karakter dan tidak boleh mengandung `url(`, `expression(`, `;`, `{`, `}`, `<`, `>`, `@import`.
- `props.src` dan `props.href`: hanya skema `https:`, `http:`, `mailto:`, `tel:`, atau diawali `#` atau `/`. Tolak `javascript:`, `data:`, `vbscript:`.

## 2.5 Seed

`prisma/seed.ts` wajib membuat:
1. Admin: email dari `SEED_ADMIN_EMAIL`, password dari `SEED_ADMIN_PASSWORD` (env), role `ADMIN`.
2. Tiga template: "Landing Page Sederhana", "Portofolio", "Halaman Kosong" (valid terhadap schema dokumen).

Seed harus **idempotent** (pakai `upsert`).

## 2.6 Housekeeping

- Hapus `sessions` yang `expires_at < now()` dan `login_attempts` lebih tua dari 24 jam secara oportunistik (saat login berhasil), bukan lewat cron.
