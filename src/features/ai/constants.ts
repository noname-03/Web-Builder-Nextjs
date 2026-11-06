import type { ProviderPreset } from "@/features/ai/types";

export const AI_PROMPT_MAX_CHARS = 4000;
export const AI_MAX_CONTEXT_CHARS = 24000;

export const AI_STYLE_OPTIONS = [
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "elegan", label: "Elegan" },
  { value: "playful", label: "Playful" },
] as const;

export const AI_PROMPT_PRESETS = [
  "Landing page SaaS dengan hero gradasi biru dan tiga kartu fitur",
  "Halaman portofolio fotografer dengan hero gambar dan galeri karya",
  "Landing page restoran dengan foto suasana dan daftar menu",
  "Halaman pricing dengan tiga paket dan paket unggulan ditonjolkan",
  "Halaman event webinar dengan agenda dan ajakan daftar",
];

export const PROVIDER_PRESETS: ProviderPreset[] = [
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { id: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini" },
  { id: "groq", label: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  { id: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { id: "ollama", label: "Ollama lokal", baseUrl: "http://localhost:11434/v1", model: "llama3.1", local: true },
  { id: "lmstudio", label: "LM Studio lokal", baseUrl: "http://localhost:1234/v1", model: "local-model", local: true },
];
