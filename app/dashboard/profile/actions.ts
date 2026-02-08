"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(profileId: string, username: string, avatarUrl?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const { data: profile } = await supabase.from("Profile").select("userId").eq("id", profileId).single();
  if (!profile || profile.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  const updates: any = { username };
  if (avatarUrl) updates.avatarUrl = avatarUrl;

  await supabase.from("Profile").update(updates).eq("id", profileId);

  revalidatePath(`/dashboard/profile/${profileId}`);
}
