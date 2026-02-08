import { createClient } from "@/lib/supabase/server";
import Step6Client from "./Step6Client";
import { redirect } from "next/navigation";

export default async function Step6Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch Desires
  const desiresReq = supabase.from("Desire").select("*").eq("projectId", id);

  // Fetch Solutions with Evaluations
  const solutionsReq = supabase
    .from("Solution")
    .select(`
      id,
      name,
      evaluations:Evaluation(desireId, score)
    `)
    .eq("projectId", id)
    .order("createdAt", { ascending: false });

  const [desiresRes, solutionsRes] = await Promise.all([desiresReq, solutionsReq]);

  return (
    <Step6Client
      projectId={id}
      desires={(desiresRes.data || []) as any[]}
      solutions={(solutionsRes.data || []) as any[]}
    />
  );
}
