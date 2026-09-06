import { getSupabase } from "@/lib/auth";
import MembersClient from "./MembersClient";

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabase();

  const [project, membersRes] = await Promise.all([
    supabase
      .from("Project")
      .select("inviteCode")
      .eq("id", id)
      .single(),

    supabase
      .from("ProjectMember")
      .select(`
        id,
        role,
        profile:Profile (
          id,
          username,
          avatarUrl
        )
      `)
      .eq("projectId", id),
  ]);

  // Cast members to match expected type (profile can be array if not careful, but relation is to-one)
  // Just ensuring typing is handled
  const formattedMembers = (membersRes.data || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
  }));

  return (
    <MembersClient
      projectId={id}
      initialMembers={formattedMembers}
      inviteCode={project.data?.inviteCode || ""}
    />
  );
}
