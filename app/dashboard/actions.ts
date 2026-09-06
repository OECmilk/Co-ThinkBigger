"use server";

import { getProfile, getSupabase } from "@/lib/auth";

export type NotificationItem = {
  id: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  link: string | null;
};

/**
 * 自分宛の通知。link 列がまだ無い環境（migration 未実行）でも
 * 一覧そのものは表示できるように、列の欠落を握って基本列だけで引き直す。
 */
export async function fetchMyNotifications(): Promise<NotificationItem[]> {
  const profile = await getProfile();
  if (!profile) return [];

  const supabase = await getSupabase();

  const withLink = await supabase
    .from("Notification")
    .select("id, title, content, read, createdAt, link")
    .eq("profileId", profile.id)
    .order("createdAt", { ascending: false })
    .limit(30);

  const rows =
    withLink.error?.code === "42703"
      ? (
          await supabase
            .from("Notification")
            .select("id, title, content, read, createdAt")
            .eq("profileId", profile.id)
            .order("createdAt", { ascending: false })
            .limit(30)
        ).data
      : withLink.data;

  return (rows || []).map((n: any) => ({
    id: String(n.id),
    title: n.title,
    content: n.content,
    read: !!n.read,
    createdAt: n.createdAt,
    link: n.link ?? null,
  }));
}

export async function markNotificationsRead(ids: string[]) {
  if (ids.length === 0) return;
  const profile = await getProfile();
  if (!profile) return;

  const supabase = await getSupabase();
  await supabase
    .from("Notification")
    .update({ read: true })
    .eq("profileId", profile.id)
    .in("id", ids);
}
