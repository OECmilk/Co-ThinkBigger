import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * リクエスト単位のメモ化ヘルパー群。
 *
 * layout と page は同じリクエストの中でレンダリングされるため、
 * React の cache() で包んでおけば「認証確認 → Profile 取得」が
 * ページ遷移 1 回につき 1 度だけになる。
 * （以前は layout / page がそれぞれ getUser() + Profile を叩いていた）
 */

export const getSupabase = cache(async () => createClient());

export const getUser = cache(async () => {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("Profile")
    .select("id, username, avatarUrl, userId")
    .eq("userId", user.id)
    .single();

  return data;
});

export const getProjectMembership = cache(async (projectId: string) => {
  const profile = await getProfile();
  if (!profile) return null;

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("ProjectMember")
    .select("role")
    .eq("projectId", projectId)
    .eq("profileId", profile.id)
    .single();

  return data;
});

export const getProjectMeta = cache(async (projectId: string) => {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("Project")
    .select("id, name, description")
    .eq("id", projectId)
    .single();

  return data;
});
