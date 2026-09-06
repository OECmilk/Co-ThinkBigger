import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

/**
 * 自分のプロフィールは /dashboard/profile/[id] に一本化する。
 * 以前はこのページが独自のバッジ定義を持っていて、
 * 実際に発行される実績 ID と噛み合わず、永久に解除されない表示になっていた。
 */
export default async function MyProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  redirect(`/dashboard/profile/${profile.id}`);
}
