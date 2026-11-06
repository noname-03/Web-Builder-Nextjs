import type { Metadata } from "next";

import {
  AiBuilderSection,
  EditorFeaturesSection,
  ExportPublishSection,
  FaqSection,
  FinalCtaSection,
  HeroSection,
  ProviderSection,
  SecuritySection,
  TemplatesSection,
  UseCasesSection,
} from "@/features/marketing/home-sections";

export const metadata: Metadata = {
  title: "Buat Halaman Web dari Drag & Drop atau Satu Prompt",
  description:
    "Web Builder menggabungkan editor visual drag & drop dengan AI pada satu sistem komponen. Export HTML satu file atau publish ke URL publik, dengan provider AI milik Anda.",
  keywords: [
    "web builder",
    "landing page builder",
    "editor drag and drop",
    "AI web builder",
    "export HTML",
    "template landing page",
    "provider AI OpenAI compatible",
    "tanpa coding",
  ],
  openGraph: {
    title: "Buat Halaman Web dari Drag & Drop atau Satu Prompt",
    description:
      "Editor visual dan AI memakai sistem komponen yang sama. Export HTML satu file, publish ke URL publik, dan pakai provider AI milik Anda.",
    type: "website",
    locale: "id_ID",
    siteName: "Web Builder",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AiBuilderSection />
      <ProviderSection />
      <EditorFeaturesSection />
      <TemplatesSection />
      <ExportPublishSection />
      <SecuritySection />
      <UseCasesSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
