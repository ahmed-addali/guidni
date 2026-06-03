import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

type Params = Promise<{ locale: string }>;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin`);
  }
  if (session.user.role !== "ADMIN") {
    redirect(`/${locale}`);
  }

  return (
    <div className="flex bg-gray-50 min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-5 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
