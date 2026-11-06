-- UUIDv7 (RFC 9562): 48-bit timestamp + versi 7 + bit acak, sortable.
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  ts_ms bigint;
  ts_bytes bytea;
  rand_bytes bytea;
  raw_bytes bytea;
BEGIN
  ts_ms := (extract(epoch FROM clock_timestamp()) * 1000)::bigint;
  ts_bytes := substring(int8send(ts_ms) FROM 3);
  rand_bytes := uuid_send(gen_random_uuid());
  raw_bytes := ts_bytes || substring(rand_bytes FROM 1 FOR 10);

  raw_bytes := set_byte(raw_bytes, 6, (get_byte(raw_bytes, 6) & 15) | 112);
  raw_bytes := set_byte(raw_bytes, 8, (get_byte(raw_bytes, 8) & 63) | 128);

  RETURN encode(raw_bytes, 'hex')::uuid;
END;
$$;

-- AlterTable
ALTER TABLE "ai_generations" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "ai_providers" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "export_logs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "login_attempts" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "page_versions" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "pages" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "templates" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
