import { createClient } from "@/lib/supabase/server";
import Step3Client from "./Step3Client";
import { redirect } from "next/navigation";

export default async function Step3Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch Profile
  const { data: profile } = await supabase
    .from("Profile")
    .select("id")
    .eq("userId", user.id)
    .single();

  if (!profile) redirect("/login");

  // Fetch Desires
  const { data: desires } = await supabase
    .from("Desire")
    .select("*")
    .eq("projectId", id)
    .order("createdAt", { ascending: true });

  return (
    <Step3Client
      projectId={id}
      desires={(desires || []) as any[]} // Type cast to match Client types if needed
      currentProfileId={profile.id}
    />
  );
}
