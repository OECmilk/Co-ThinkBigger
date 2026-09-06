import { getSupabase, getProfile } from "@/lib/auth";
import Step3Client from "./Step3Client";
import { redirect } from "next/navigation";

export default async function Step3Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabase();

  const [profile, desiresRes] = await Promise.all([
    getProfile(),

    // Fetch Desires
    supabase
      .from("Desire")
      .select("*")
      .eq("projectId", id)
      .order("createdAt", { ascending: true }),
  ]);

  if (!profile) redirect("/login");

  return (
    <Step3Client
      projectId={id}
      desires={(desiresRes.data || []) as any[]}
      currentProfileId={profile.id}
    />
  );
}
