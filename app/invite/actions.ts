"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function joinProjectByCode(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/invite/${code}`);

  // Get Profile
  const { data: profile } = await supabase.from("Profile").select("id").eq("userId", user.id).single();
  if (!profile) throw new Error("Profile not found");

  // Find Project by Code
  const { data: project } = await supabase
    .from("Project")
    .select("id")
    .eq("inviteCode", code)
    .single();

  if (!project) {
    return { error: "プロジェクトが見つかりません。コードを確認してください。" };
  }

  // Check if already member
  const { data: existing } = await supabase
    .from("ProjectMember")
    .select("id")
    .eq("projectId", project.id)
    .eq("profileId", profile.id)
    .single();

  if (existing) {
    return { success: true, projectId: project.id };
  }

  // Add Member
  await supabase.from("ProjectMember").insert({
    projectId: project.id,
    profileId: profile.id,
    role: "member"
  });

  revalidatePath(`/dashboard/projects/${project.id}`);
  return { success: true, projectId: project.id };
}
