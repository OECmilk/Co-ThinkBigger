
import { createClient } from "@/lib/supabase/server";
import MindMapClient from "./MindMapClient";

export default async function MindMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch current user profile
  const { data: profile } = await supabase.from('Profile').select('id, username, avatarUrl').eq('userId', user?.id).single();

  // Fetch nodes and edges (Client component will filter 'scope' or we fetch all)
  // We need to fetch both 'team' scope AND 'personal' scope for this user.
  // Actually simpler to fetch all for this project and filter in client or fetch specifically.
  // Let's fetch all relevant: scope='team' OR (scope='personal' AND authorId=myId)

  const { data: initialNodes } = await supabase
    .from("MindMapNode")
    .select("*, author:Profile(username, avatarUrl)")
    .eq("projectId", id);
  // .or(`scope.eq.team,and(scope.eq.personal,authorId.eq.${profile.id})`); // Requires complex query logic or filtering in JS. 
  // Supabase JS .or syntax is tricky with mixed AND.
  // Let's just fetch all project nodes and filter in Client or use more specific RLS?
  // RLS already restricts 'personal' scope? No, we haven't set RLS for 'scope' specifically, just project membership.
  // For MVP, fetch all project nodes and filter in Client. Privacy relies on Client filtering (NOT SECURE for production but ok for MVP prototype if we trust members).
  // Ideally update RLS: allow read if scope='team' OR authorId=me.

  const { data: initialEdges } = await supabase
    .from("MindMapEdge")
    .select("*")
    .eq("projectId", id);

  // Filter for initial state security/correctness?
  // Let's trust client filtering for now or do it here.
  const filteredNodes = initialNodes?.filter(n => n.scope === 'team' || n.authorId === profile?.id) || [];
  const filteredEdges = initialEdges?.filter(e => e.scope === 'team' || e.authorId === profile?.id) || [];

  return (
    <div className="h-full">
      <MindMapClient
        projectId={id}
        initialNodes={filteredNodes}
        initialEdges={filteredEdges}
        currentProfile={profile}
      />
    </div>
  );
}
