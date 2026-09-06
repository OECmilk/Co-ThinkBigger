import { getSupabase, getProfile, getProjectMeta } from "@/lib/auth";
import Step2Client from "./Step2Client";
import { redirect } from "next/navigation";

export default async function Step2Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabase();

  const [profile, project, subProblemsRes] = await Promise.all([
    getProfile(),

    // layout でも取得済み（キャッシュヒット）
    getProjectMeta(id),

    // Fetch SubProblems
    supabase
      .from("SubProblem")
      .select("*")
      .eq("projectId", id)
      .order("order", { ascending: true })
      .order("createdAt", { ascending: true }),
  ]);

  if (!profile) redirect("/login");

  return (
    <Step2Client
      projectId={id}
      initialDescription={project?.description || ""}
      subProblems={subProblemsRes.data || []}
      currentProfileId={profile.id}
    />
  );
}
