import { getSupabase, getProfile } from "@/lib/auth";
import { getProjectProgress, getProjectSnapshot } from "@/lib/project";
import Step1Client from "./Step1Client";
import { redirect } from "next/navigation";

export default async function Step1Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabase();

  const [profile, snapshot, progress, candidatesRes] = await Promise.all([
    getProfile(),
    getProjectSnapshot(id),
    getProjectProgress(id),
    supabase
      .from("Candidate")
      .select(
        `id, title, authorId, createdAt,
         reactions:Reaction(score, profileId),
         messages:Message(count)`
      )
      .eq("projectId", id)
      .order("createdAt", { ascending: false }),
  ]);

  if (!profile) redirect("/login");

  // 投稿者と投票者を、プロジェクトメンバーの情報に突き合わせて名前・アイコンを出せるようにする。
  // Candidate.authorId は Auth の user id、Reaction.profileId は Profile.id という
  // 歴史的なズレがあるので、ここで両方引ける形に正規化しておく。
  const candidates = (candidatesRes.data || []).map((c: any) => ({
    id: String(c.id),
    title: c.title,
    createdAt: c.createdAt,
    author: snapshot.memberByUserId.get(String(c.authorId)) ?? null,
    isMine: String(c.authorId) === String(profile.userId),
    messageCount: c.messages?.[0]?.count ?? 0,
    reactions: (c.reactions || []).map((r: any) => ({
      score: r.score,
      profileId: String(r.profileId),
      username: snapshot.memberByProfileId.get(String(r.profileId))?.username ?? "不明",
    })),
  }));

  return (
    <Step1Client
      projectId={id}
      step={progress.steps[0]}
      progress={progress}
      candidates={candidates}
      currentProfileId={String(profile.id)}
      mainProblem={snapshot.description}
      totalMembers={Math.max(snapshot.members.length, 1)}
    />
  );
}
