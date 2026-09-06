import { getSupabase, getUser } from "@/lib/auth";
import Step6Client from "./Step6Client";
import { redirect } from "next/navigation";

export default async function Step6Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabase();

  const [user, desiresRes, solutionsRes] = await Promise.all([
    getUser(),

    // Fetch Desires
    supabase.from("Desire").select("*").eq("projectId", id),

    // Fetch Solutions with Evaluations
    supabase
      .from("Solution")
      .select(`
        id,
        name,
        evaluations:Evaluation(desireId, score)
      `)
      .eq("projectId", id)
      .order("createdAt", { ascending: false }),
  ]);

  if (!user) redirect("/login");

  return (
    <Step6Client
      projectId={id}
      desires={(desiresRes.data || []) as any[]}
      solutions={(solutionsRes.data || []) as any[]}
    />
  );
}
