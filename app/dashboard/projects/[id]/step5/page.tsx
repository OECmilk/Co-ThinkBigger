import { getSupabase, getUser } from "@/lib/auth";
import Step5Client from "./Step5Client";
import { redirect } from "next/navigation";

export default async function Step5Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabase();

  // Fetch Data (Parallel)
  const [user, subProblemsRes, solutionsRes] = await Promise.all([
    getUser(),

    supabase
      .from("SubProblem")
      .select(`
        *,
        choices:Choice(*)
      `)
      .eq("projectId", id)
      .order("order"),

    supabase
      .from("Solution")
      .select("*")
      .eq("projectId", id)
      .order("createdAt", { ascending: false })
  ]);

  if (!user) redirect("/login");

  return (
    <Step5Client
      projectId={id}
      subProblems={subProblemsRes.data || []}
      solutions={solutionsRes.data || []} // Note: components is JSONB, typed as any by Supabase client usually
    />
  );
}
