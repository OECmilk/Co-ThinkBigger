import { getSupabase, getProfile, getUser } from "@/lib/auth";
import Step1Client from "./Step1Client";
import { redirect } from "next/navigation";

export default async function Step1Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabase();

  // 認証情報は layout で解決済みのものがキャッシュから返るため、
  // 認証待ちをせずにページ本体のクエリを並列で走らせる。
  const [user, profile, candidatesRes, memberCountRes] = await Promise.all([
    getUser(),
    getProfile(),

    // Fetch Candidates with Reactions
    supabase
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
      .order("createdAt", { ascending: false }),

    // Fetch Member Count
    supabase
      .from("ProjectMember")
      .select("id", { count: "exact", head: true })
      .eq("projectId", id),
  ]);

  if (!user) redirect("/login");
  if (!profile) return <div>Profile Error (Please re-login)</div>;

  const totalMembers = memberCountRes.count || 1;

  return (
    <Step1Client
      projectId={id}
      candidates={candidatesRes.data as any}
      currentProfileId={profile.id}
      currentUserId={user.id}
      totalMembers={totalMembers}
    />
  );
}
