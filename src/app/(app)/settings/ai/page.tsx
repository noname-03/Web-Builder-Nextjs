import type { Metadata } from "next";
import { ProvidersManager } from "@/features/ai/components/providers-manager";
import { requireUserOrRedirect } from "@/server/auth/guards";
import { listProviders } from "@/server/services/ai-provider-service";

export const metadata: Metadata = { title: "Pengaturan AI" };

export default async function AiSettingsPage() {
  const user = await requireUserOrRedirect("/settings/ai");
  const providers = await listProviders(user.id);

  return <ProvidersManager initialProviders={providers} />;
}
