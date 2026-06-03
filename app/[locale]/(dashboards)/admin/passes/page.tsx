import Link from "next/link";
import { getPassesByDestination } from "@/lib/actions/passes";
import { FiPlus, FiEdit2, FiStar } from "react-icons/fi";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "Passes — Admin" };
}

export default async function AdminPassesPage({ params }: { params: Params }) {
  const { locale } = await params;
  const passes = await getPassesByDestination();

  return (
    <div className="space-y-6 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Passes</h1>
          <p className="text-sm text-gray-400 mt-1">{passes.length} pass(es) configured</p>
        </div>
        <Link
          href={`/${locale}/admin/passes/new`}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
        >
          <FiPlus className="h-4 w-4" />
          New Pass
        </Link>
      </div>

      {passes.length === 0 ? (
        <div className="text-center py-24 text-gray-400 bg-white border border-gray-100 rounded-2xl">
          No passes yet. Create one to get started.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 font-medium">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Pass Key</th>
                <th className="text-left px-5 py-3">Price</th>
                <th className="text-left px-5 py-3">Fixed</th>
                <th className="text-left px-5 py-3">Optional</th>
                <th className="text-left px-5 py-3">Destination</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {passes.map((pass) => (
                <tr key={pass.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {pass.name}
                      {pass.popular && (
                        <FiStar className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{pass.passKey}</td>
                  <td className="px-5 py-3 text-gray-700">
                    {pass.discount > 0 ? (
                      <span>
                        {Math.round(pass.price * (1 - pass.discount / 100))} TND{" "}
                        <span className="text-xs text-gray-400 line-through">{pass.price}</span>
                      </span>
                    ) : (
                      <>{pass.price} TND</>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{pass.fixedActivities.length}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {pass.optionalActivities.length} ({pass.optionalCount} picks)
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {pass.destination?.city ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/${locale}/admin/passes/${pass.passKey}`}
                      className="flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
