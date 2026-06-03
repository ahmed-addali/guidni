import { getMyBusinessProfile } from "@/lib/actions/partner";
import { ProfileForm } from "./_components/ProfileForm";
import { CategoriesSection } from "./_components/CategoriesSection";
import { AvatarUploader } from "@/components/upload/AvatarUploader";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  return { title: "Business Profile · Partner Dashboard" };
}

export default async function PartnerProfilePage() {
  const profile = await getMyBusinessProfile();
  if (!profile) notFound();

  return (
    <div className="space-y-6 max-w-screen-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
        <p className="text-sm text-gray-400 mt-1">Update your public business information.</p>
      </div>

      {/* Avatar + business name */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <AvatarUploader
          profileId={profile.id}
          currentImage={profile.profileImage}
          businessName={profile.name}
        />
      </div>

      {/* Business info + contact */}
      <ProfileForm profile={profile} />

      {/* Categories management */}
      <CategoriesSection current={profile.categories} />
    </div>
  );
}
