import { getSupabase, getProfile } from "@/lib/auth";
import MindMapClient from "./MindMapClient";

export default async function MindMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabase();

  // Fetch nodes and edges (Client component will filter 'scope' or we fetch all)
  // 'team' スコープと、自分の 'personal' スコープの両方が必要なので、
  // プロジェクト分をまとめて取得して後段で絞り込む。
  // （本来は RLS 側で scope を考慮するのが望ましい）
  const [profile, nodesRes, edgesRes] = await Promise.all([
    getProfile(),

    supabase
      .from("MindMapNode")
      .select("*, author:Profile(username, avatarUrl)")
      .eq("projectId", id),

    supabase
      .from("MindMapEdge")
      .select("*")
      .eq("projectId", id),
  ]);

  const filteredNodes = nodesRes.data?.filter(n => n.scope === 'team' || n.authorId === profile?.id) || [];
  const filteredEdges = edgesRes.data?.filter(e => e.scope === 'team' || e.authorId === profile?.id) || [];

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
