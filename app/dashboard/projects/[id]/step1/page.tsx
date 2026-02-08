import { createClient } from "@/lib/supabase/server";
import Step1Client from "./Step1Client";
import { redirect } from "next/navigation";

export default async function Step1Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get current profile id
  const { data: profile } = await supabase
    .from("Profile")
    .select("id")
    .eq("userId", user.id)
    .single();

  if (!profile) return <div>Profile Error (Please re-login)</div>;

  // Fetch Candidates with Reactions
  const { data: candidates } = await supabase
    .from("Candidate")
    .select(`
      id,
      title,
      authorId,
      createdAt,
      reactions:Reaction(score, profile:Profile(id, username)),
      messages:Message(count)
    `)
    .eq("projectId", id)
    .eq("projectId", id)
    .order("createdAt", { ascending: false });

  // Fetch Member Count
  const { count: memberCount } = await supabase
    .from("ProjectMember")
    .select("id", { count: "exact", head: true })
    .eq("projectId", id);

  // If owner is not in ProjectMember table, we might need to adjust.
  // Generally robust apps put owner in members.
  // Let's assume count is correct or at least > 0.
  const totalMembers = memberCount || 1;

  // Transform data slightly to match Client Props safety (if needed, here it's mostly fine)
  // Note: Prisma returns relations, Supabase returns similar structure.

  return (
    <Step1Client
      projectId={id}
      candidates={candidates as any}
      currentProfileId={profile.id}
      currentUserId={user.id}
      totalMembers={totalMembers}
    />
  );
}
