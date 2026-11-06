import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://postgres@localhost:5432/webbuilder?schema=public",
      ENCRYPTION_KEY: "wXkPr/22VVQqP3x5WiiiLZZ/b8JIXj76MZf4Nt7G71s=",
      ENCRYPTION_KEY_VERSION: "v1",
      AI_REQUEST_TIMEOUT_MS: "5000",
      AI_MAX_PROMPT_CHARS: "4000",
      AI_MAX_CONTEXT_CHARS: "24000",
      AI_RATE_LIMIT_PER_HOUR: "30",
    },
  },
});
