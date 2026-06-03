import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getDestinations } from "@/lib/actions/destinations";
import { CreatePassForm } from "./_components/CreatePassForm";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "New Pass — Admin" };
}

export default async function NewPassPage({ params }: { params: Params }) {
  const { locale } = await params;
  const [destinations] = await Promise.all([
    getDestinations(),
    getTranslations({ locale, namespace: "Admin" }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={`/${locale}/admin/passes`}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Passes
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Pass</h1>
        <p className="text-sm text-gray-400 mt-1">Define a new guided pass with included activities.</p>
      </div>

      <CreatePassForm
        destinations={destinations.map((d) => ({ id: d.id, label: `${d.city}, ${d.country}` }))}
        locale={locale}
      />
    </div>
  );
}
