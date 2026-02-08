import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProjectSidebar } from "@/components/input/ProjectSidebar";
import { cn } from "@/lib/utils";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Check Project Existence & Membership
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // First fetch profile id for the user
  const { data: profile } = await supabase.from('Profile').select('id').eq('userId', user.id).single();

  if (!profile) {
    // Should resolve by auto-creation, but if not:
    notFound();
  }

  const { data: member } = await supabase
    .from("ProjectMember")
    .select("role")
    .eq("projectId", id)
    .eq("profileId", profile.id) // Use profileId directly
    .single();

  if (!member) {
    // Check if project exists but user is not a member -> specific error page or notFound
    // For now, simpler handling:
    notFound();
  }

  // 2. Fetch Project Meta
  const { data: project } = await supabase
    .from("Project")
    .select("name")
    .eq("id", id)
    .single();



  return (
    <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-64px)]">
      {/* Sidebar Navigation */}
      <ProjectSidebar projectId={id} projectName={project?.name || "Project"} />

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
