import Link from "next/link";

export default function EditPlanNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <p className="text-4xl font-bold text-gray-200">404</p>
        <h1 className="text-xl font-semibold text-gray-900">Plan not found</h1>
        <p className="text-sm text-gray-500">
          This plan doesn't exist or you don't have permission to edit it.
        </p>
        <Link
          href="../plans"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to my plans
        </Link>
      </div>
    </div>
  );
}
