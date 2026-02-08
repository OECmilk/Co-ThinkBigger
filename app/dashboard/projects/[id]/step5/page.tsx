import { createClient } from "@/lib/supabase/server";
import Step5Client from "./Step5Client";
import { redirect } from "next/navigation";

export default async function Step5Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch Data (Parallel)
  const [subProblemsRes, solutionsRes] = await Promise.all([
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

  return (
    <Step5Client
      projectId={id}
      subProblems={subProblemsRes.data || []}
      solutions={solutionsRes.data || []} // Note: components is JSONB, typed as any by Supabase client usually
    />
  );
}
