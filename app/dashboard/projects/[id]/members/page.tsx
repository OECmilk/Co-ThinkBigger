import { getProjectSnapshot } from "@/lib/project";
import MembersClient from "./MembersClient";

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // メンバーと招待コードは layout が取得済みのスナップショットから
  const snapshot = await getProjectSnapshot(id);

  const members = snapshot.members.map((m) => ({
    id: String(m.profile.id),
    role: m.role,
    profile: {
      id: String(m.profile.id),
      username: m.profile.username,
      avatarUrl: m.profile.avatarUrl,
    },
  }));

  return <MembersClient projectId={id} initialMembers={members} inviteCode={snapshot.inviteCode || ""} />;
}
