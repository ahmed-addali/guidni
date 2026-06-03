import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPassByKey, getAllActivities } from "@/lib/actions/passes";
import { getDestinations } from "@/lib/actions/destinations";
import { EditPassForm } from "./_components/EditPassForm";
import { PassActivitiesTab } from "./_components/PassActivitiesTab";

type Params = Promise<{ locale: string; passKey: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { passKey } = await params;
  return { title: `${passKey} — Admin Passes` };
}

export default async function AdminPassEditPage({ params }: { params: Params }) {
  const { locale, passKey } = await params;

  const [pass, destinations, activities] = await Promise.all([
    getPassByKey(passKey),
    getDestinations(),
    getAllActivities(undefined),
  ]);

  if (!pass) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href={`/${locale}/admin/passes`}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Passes
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{pass.name}</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono">{pass.passKey}</p>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="border-b border-gray-100 w-full justify-start rounded-none bg-transparent px-0 mb-6">
          <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Details
          </TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Activities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <EditPassForm
            pass={pass}
            destinations={destinations.map((d) => ({ id: d.id, label: `${d.city}, ${d.country}` }))}
          />
        </TabsContent>

        <TabsContent value="activities">
          <PassActivitiesTab
            passKey={pass.passKey}
            allActivities={activities}
            fixedIds={pass.fixedActivities.map((a) => a.id)}
            optionalIds={pass.optionalActivities.map((a) => a.id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
