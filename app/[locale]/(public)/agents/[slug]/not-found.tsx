import Link from "next/link";

export default function AgentNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
      <h1 className="text-3xl font-bold text-gray-900">Agent not found</h1>
      <p className="text-muted-foreground max-w-sm">
        This agent profile doesn&apos;t exist or is no longer active.
      </p>
      <Link
        href="../leaderboard"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
      >
        View leaderboard
      </Link>
    </div>
  );
}
