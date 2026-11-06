-- CreateEnum
CREATE TYPE "AiMode" AS ENUM ('GENERATE', 'MODIFY');

-- CreateEnum
CREATE TYPE "AiStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "ai_providers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "base_url" VARCHAR(300) NOT NULL,
    "api_key_encrypted" TEXT NOT NULL,
    "api_key_last4" VARCHAR(4) NOT NULL,
    "model" VARCHAR(120) NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "max_tokens" INTEGER NOT NULL DEFAULT 4096,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "page_id" UUID,
    "provider_id" UUID,
    "mode" "AiMode" NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "AiStatus" NOT NULL,
    "error_code" VARCHAR(40),
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "catalog_version" VARCHAR(40),
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_providers_user_id_idx" ON "ai_providers"("user_id");

-- CreateIndex
CREATE INDEX "ai_generations_user_id_created_at_idx" ON "ai_generations"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_generations_page_id_idx" ON "ai_generations"("page_id");

-- AddForeignKey
ALTER TABLE "ai_providers" ADD CONSTRAINT "ai_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Satu default provider per user
CREATE UNIQUE INDEX "ai_providers_user_default_key"
  ON "ai_providers" ("user_id")
  WHERE "is_default" = true;

-- Nama provider unik per user (case-insensitive)
CREATE UNIQUE INDEX "ai_providers_user_name_key"
  ON "ai_providers" ("user_id", lower("name"));

-- Batas nilai provider
ALTER TABLE "ai_providers"
  ADD CONSTRAINT "ai_providers_temperature_chk" CHECK ("temperature" >= 0 AND "temperature" <= 2);

ALTER TABLE "ai_providers"
  ADD CONSTRAINT "ai_providers_max_tokens_chk" CHECK ("max_tokens" >= 256 AND "max_tokens" <= 32000);

ALTER TABLE "ai_providers"
  ADD CONSTRAINT "ai_providers_api_key_last4_chk" CHECK (char_length("api_key_last4") = 4);
