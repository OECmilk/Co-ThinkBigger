import { redirect } from "next/navigation";
import { getSupabase, getUser } from "@/lib/auth";
import { ProfileClient } from "./ProfileClient";
import { getContributionData } from "@/app/dashboard/projects/[id]/actions";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabase();

  const [user, profileRes, achievementsRes, contributionData] = await Promise.all([
    getUser(),
    supabase.from("Profile").select("*").eq("id", id).single(),
    supabase.from("Achievement").select("*").eq("profileId", id),
    getContributionData(id),
  ]);

  if (!user) redirect("/login");

  const profile = profileRes.data;
  if (!profile) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center bg-white p-8 pixel-border-sm">
        <p className="font-bold">プロフィールが見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <ProfileClient
      profile={profile}
      achievements={achievementsRes.data || []}
      contributionData={contributionData || {}}
      isOwner={profile.userId === user.id}
      email={profile.userId === user.id ? user.email : undefined}
    />
  );
}
