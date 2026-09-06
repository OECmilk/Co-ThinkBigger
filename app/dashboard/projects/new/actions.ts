"use server";

import { revalidatePath } from "next/cache";
import { getProfile, getSupabase, getUser } from "@/lib/auth";

/**
 * プロジェクト作成。
 *
 * 以前はブラウザから直接 insert しており、
 * 「プロジェクトだけ出来てメンバー登録に失敗する」と
 * 自分のプロジェクト一覧に出てこない迷子状態になり得た。
 * サーバー側にまとめ、失敗したらプロジェクトごと片付ける。
 */
export async function createProject(
  name: string,
  description: string
): Promise<{ error?: string; projectId?: string }> {
  const user = await getUser();
  if (!user) return { error: "ログインが必要です。" };

  const trimmedName = name.trim();
  if (!trimmedName) return { error: "プロジェクト名を入力してください。" };

  const supabase = await getSupabase();

  // Profile が無ければ先に作る（トリガー未設定の環境向けの保険）
  let profile = await getProfile();
  if (!profile) {
    const { data: created, error } = await supabase
      .from("Profile")
      .insert({
        userId: user.id,
        username:
          user.user_metadata.username ||
          user.email?.split("@")[0] ||
          `user_${Math.random().toString(36).slice(2, 7)}`,
      })
      .select("id, userId, username, avatarUrl")
      .single();
    if (error || !created) return { error: "プロフィールの作成に失敗しました。" };
    profile = created as any;
  }

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: project, error: projectError } = await supabase
    .from("Project")
    .insert({ name: trimmedName, description: description.trim(), inviteCode })
    .select("id")
    .single();

  if (projectError || !project) return { error: "プロジェクトの作成に失敗しました。" };

  const { error: memberError } = await supabase
    .from("ProjectMember")
    .insert({ projectId: project.id, profileId: profile!.id, role: "owner" });

  if (memberError) {
    // 自分が入れないプロジェクトを残さない
    await supabase.from("Project").delete().eq("id", project.id);
    return { error: "プロジェクトへの参加処理に失敗しました。もう一度お試しください。" };
  }

  revalidatePath("/dashboard");
  return { projectId: String(project.id) };
}
