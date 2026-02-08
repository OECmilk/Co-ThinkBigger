import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "./ProfileClient";
import { redirect } from "next/navigation";
import { getContributionData } from "@/app/dashboard/projects/[id]/actions";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch Profile Info
  const { data: profile } = await supabase
    .from("Profile")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  // Determine ownership
  // We need to check if the current user's profile ID matches the requested 'id'
  // Or check if profile.userId matches user.id
  const isOwner = profile.userId === user.id;

  // Fetch Achievements
  const { data: achievements } = await supabase
    .from("Achievement")
    .select("*")
    .eq("profileId", id);

  // Fetch Contribution Data
  const contributionData = await getContributionData(id);

  return (
    <ProfileClient
      profile={profile}
      achievements={achievements || []}
      contributionData={contributionData || {}}
      isOwner={isOwner}
      email={isOwner ? user.email : undefined}
    />
  );
}
