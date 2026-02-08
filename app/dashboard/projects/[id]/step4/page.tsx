import { createClient } from "@/lib/supabase/server";
import Step4Client from "./Step4Client";
import { redirect } from "next/navigation";

export default async function Step4Page({
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

  // Fetch SubProblems with Choices
  const { data: subProblems } = await supabase
    .from("SubProblem")
    .select(`
      *,
      choices:Choice(*)
    `)
    .eq("projectId", id)
    .order("order", { ascending: true })
    .order("createdAt", { ascending: true });

  return (
    <Step4Client
      projectId={id}
      subProblems={subProblems || []}
      currentProfileId={profile.id}
    />
  );
}
