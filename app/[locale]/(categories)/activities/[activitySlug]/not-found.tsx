import Link from "next/link";

export default function ActivityNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
      <h1 className="text-3xl font-bold text-gray-900">Activity not found</h1>
      <p className="text-muted-foreground max-w-sm">
        This activity may no longer be available or the link is incorrect.
      </p>
      <Link
        href="../activities"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
      >
        Browse all activities
      </Link>
    </div>
  );
}
