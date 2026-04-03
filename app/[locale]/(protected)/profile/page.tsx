import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { getProfile } from "@/lib/actions/profile";
import { ProfileForm } from "./_components/ProfileForm";
import { Separator } from "@/components/ui/separator";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProfilePage" });
  return { title: t("title") };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { locale } = await params;

  const [profile, t] = await Promise.all([
    getProfile(),
    getTranslations({ locale, namespace: "ProfilePage" }),
  ]);

  if (!profile) notFound();

  const joinedDate = profile.createdAt.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <MaxWidthWrapper className="py-8">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("memberSince")} {joinedDate}
          </p>
        </div>

        {/* Avatar + name header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t("editTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("editSubtitle")}</p>
        </div>

        <ProfileForm
          profile={profile}
          labels={{
            name: t("name"),
            phone: t("phone"),
            bio: t("bio"),
            city: t("city"),
            country: t("country"),
            address: t("address"),
            save: t("save"),
            saving: t("saving"),
            saved: t("saved"),
            error: t("error"),
          }}
        />
      </div>
    </MaxWidthWrapper>
  );
}
