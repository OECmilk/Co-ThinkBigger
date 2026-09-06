import { getSupabase } from "@/lib/auth";
import type { MemberProfile } from "@/lib/project";

/**
 * ホーム画面用のデータ。
 *
 * これまでのホームは「プロジェクトのカードが並ぶだけ」で、
 * 開いても次の行動が決まらなかった。
 * 毎日ひらく場所にするために必要なのは
 *   ・今日やる1つ ・自分の継続 ・仲間の動き
 * の3つなので、それをまとめて取る。
 */

export type FeedEntry = {
  id: string;
  kind: "candidate" | "subProblem" | "desire" | "choice" | "solution" | "message";
  label: string;
  text: string;
  projectId: string;
  projectName: string;
  href: string;
  author: MemberProfile | null;
  createdAt: string;
};

const KIND_META: Record<FeedEntry["kind"], { label: string; step: string }> = {
  candidate: { label: "課題候補", step: "step1" },
  subProblem: { label: "サブ課題", step: "step2" },
  desire: { label: "望み", step: "step3" },
  choice: { label: "先行事例", step: "step4" },
  solution: { label: "解決策", step: "step5" },
  message: { label: "コメント", step: "step2" },
};

export type MemberIndex = {
  byProfileId: Map<string, MemberProfile>;
  byUserId: Map<string, MemberProfile>;
};

/** 対象プロジェクトのメンバー情報を 1 回で引いて、名前・アイコンを引けるようにする */
export async function getMemberIndex(projectIds: string[]): Promise<MemberIndex> {
  const byProfileId = new Map<string, MemberProfile>();
  const byUserId = new Map<string, MemberProfile>();
  if (projectIds.length === 0) return { byProfileId, byUserId };

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("ProjectMember")
    .select("profile:Profile(id, userId, username, avatarUrl)")
    .in("projectId", projectIds);

  (data || []).forEach((row: any) => {
    const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (!p) return;
    const profile: MemberProfile = {
      id: String(p.id),
      userId: String(p.userId),
      username: p.username,
      avatarUrl: p.avatarUrl ?? null,
    };
    byProfileId.set(profile.id, profile);
    byUserId.set(profile.userId, profile);
  });

  return { byProfileId, byUserId };
}

/** 参加中のプロジェクト横断で「最近あったこと」を集める */
export async function getActivityFeed(
  projects: { id: string; name: string }[],
  members: MemberIndex,
  limit = 14
): Promise<FeedEntry[]> {
  if (projects.length === 0) return [];

  const supabase = await getSupabase();
  const ids = projects.map((p) => p.id);
  const nameById = new Map(projects.map((p) => [p.id, p.name]));

  const [candidates, subs, desires, choices, solutions, messages] = await Promise.all([
    supabase.from("Candidate").select("id, title, authorId, createdAt, projectId").in("projectId", ids).order("createdAt", { ascending: false }).limit(limit),
    supabase.from("SubProblem").select("id, title, authorId, createdAt, projectId, isShared").in("projectId", ids).order("createdAt", { ascending: false }).limit(limit),
    supabase.from("Desire").select("id, content, authorId, createdAt, projectId, isShared").in("projectId", ids).order("createdAt", { ascending: false }).limit(limit),
    supabase.from("Choice").select("id, title, authorId, createdAt, isShared, subProblem:SubProblem!inner(projectId)").in("subProblem.projectId", ids).order("createdAt", { ascending: false }).limit(limit),
    supabase.from("Solution").select("*").in("projectId", ids).order("createdAt", { ascending: false }).limit(limit),
    supabase.from("Message").select("id, content, profileId, createdAt, projectId").in("projectId", ids).order("createdAt", { ascending: false }).limit(limit),
  ]);

  const entries: FeedEntry[] = [];

  const push = (
    kind: FeedEntry["kind"],
    row: any,
    text: string,
    projectId: string,
    author: MemberProfile | null
  ) => {
    const name = nameById.get(projectId);
    if (!name || !text) return;
    entries.push({
      id: kind + "-" + row.id,
      kind,
      label: KIND_META[kind].label,
      text,
      projectId,
      projectName: name,
      href: `/dashboard/projects/${projectId}/${KIND_META[kind].step}`,
      author,
      createdAt: row.createdAt,
    });
  };

  (candidates.data || []).forEach((r: any) =>
    push("candidate", r, r.title, String(r.projectId), members.byUserId.get(String(r.authorId)) ?? null)
  );
  (subs.data || []).forEach((r: any) => {
    if (!r.isShared) return; // 個人の下書きは他人のフィードに出さない
    push("subProblem", r, r.title, String(r.projectId), members.byProfileId.get(String(r.authorId)) ?? null);
  });
  (desires.data || []).forEach((r: any) => {
    if (!r.isShared) return;
    push("desire", r, r.content, String(r.projectId), members.byProfileId.get(String(r.authorId)) ?? null);
  });
  (choices.data || []).forEach((r: any) => {
    if (!r.isShared) return;
    const projectId = String(r.subProblem?.projectId ?? "");
    push("choice", r, r.title, projectId, members.byProfileId.get(String(r.authorId)) ?? null);
  });
  (solutions.data || []).forEach((r: any) =>
    push("solution", r, r.name || "無題のアイデア", String(r.projectId), members.byProfileId.get(String(r.authorId)) ?? null)
  );
  (messages.data || []).forEach((r: any) =>
    push("message", r, r.content, String(r.projectId), members.byProfileId.get(String(r.profileId)) ?? null)
  );

  return entries
    .filter((e) => e.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
