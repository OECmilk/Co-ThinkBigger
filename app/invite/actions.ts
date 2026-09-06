"use server";

import { revalidatePath } from "next/cache";
import { getProfile, getSupabase, getUser } from "@/lib/auth";
import { notifyProjectMembers } from "@/lib/notifications";

export async function joinProjectByCode(
  code: string
): Promise<{ error?: string; projectId?: string }> {
  const user = await getUser();
  if (!user) return { error: "ログインが必要です。" };

  const supabase = await getSupabase();

  // Profile が無い場合は作ってから参加させる（登録直後の合流でつまずかせない）
  let profile = await getProfile();
  if (!profile) {
    const { data: created } = await supabase
      .from("Profile")
      .insert({
        userId: user.id,
        username: user.user_metadata.username || user.email?.split("@")[0] || "User",
      })
      .select("id, userId, username, avatarUrl")
      .single();
    profile = created as any;
  }
  if (!profile) return { error: "プロフィールの作成に失敗しました。" };

  const { data: project } = await supabase
    .from("Project")
    .select("id, name")
    .eq("inviteCode", code)
    .single();

  if (!project) return { error: "プロジェクトが見つかりません。コードを確認してください。" };

  const projectId = String(project.id);

  const { data: existing } = await supabase
    .from("ProjectMember")
    .select("id")
    .eq("projectId", project.id)
    .eq("profileId", profile.id)
    .maybeSingle();

  // すでにメンバーなら、そのままプロジェクトへ通す（二重参加でエラーにしない）
  if (existing) return { projectId };

  const { error } = await supabase
    .from("ProjectMember")
    .insert({ projectId: project.id, profileId: profile.id, role: "member" });

  if (error) return { error: "参加処理に失敗しました。もう一度お試しください。" };

  // 既存メンバーに「誰が入ってきたか」を知らせる
  await notifyProjectMembers({
    projectId,
    actorProfileId: String(profile.id),
    title: "新しいメンバーが参加しました",
    content: `${profile.username} さんが招待リンクから参加しました`,
    link: `/dashboard/projects/${projectId}/members`,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}/members`);
  return { projectId };
}
