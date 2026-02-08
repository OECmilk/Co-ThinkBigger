import { createClient } from "@/lib/supabase/server";
import Step2Client from "./Step2Client";
import { redirect } from "next/navigation";

export default async function Step2Page({
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

  // Fetch Project Description
  const { data: project } = await supabase
    .from("Project")
    .select("description")
    .eq("id", id)
    .single();

  // Fetch SubProblems
  const { data: subProblems } = await supabase
    .from("SubProblem")
    .select("*")
    .eq("projectId", id)
    .order("order", { ascending: true }) // If order isn't used yet, defaults to 0 and likely insertion order
    .order("createdAt", { ascending: true });

  return (
    <Step2Client
      projectId={id}
      initialDescription={project?.description || ""}
      subProblems={subProblems || []}
      currentProfileId={profile.id}
    />
  );
}
