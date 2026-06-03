import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { PlanPreview } from "./_components/PlanPreview";

export const metadata: Metadata = {
  title: "Your Generated Plan — Guidni",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PlanPreviewPage({ params }: Props) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/planner/ai/preview`);
  }

  return <PlanPreview locale={locale} />;
}
