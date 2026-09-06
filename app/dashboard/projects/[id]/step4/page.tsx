import { getSupabase, getProfile } from "@/lib/auth";
import Step4Client from "./Step4Client";
import { redirect } from "next/navigation";

export default async function Step4Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabase();

  const [profile, subProblemsRes] = await Promise.all([
    getProfile(),

    // Fetch SubProblems with Choices
    supabase
      .from("SubProblem")
      .select(`
        *,
        choices:Choice(*)
      `)
      .eq("projectId", id)
      .order("order", { ascending: true })
      .order("createdAt", { ascending: true }),
  ]);

  if (!profile) redirect("/login");

  return (
    <Step4Client
      projectId={id}
      subProblems={subProblemsRes.data || []}
      currentProfileId={profile.id}
    />
  );
}
