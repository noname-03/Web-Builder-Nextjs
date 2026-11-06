-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "public_slug" VARCHAR(120),
ADD COLUMN     "published_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE UNIQUE INDEX "pages_public_slug_key" ON "pages"("public_slug");

-- Halaman yang dipublikasikan wajib punya tanggal publikasi
ALTER TABLE "pages"
  ADD CONSTRAINT "pages_published_at_chk" CHECK ("is_published" = false OR "published_at" IS NOT NULL);
