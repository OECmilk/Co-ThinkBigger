import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getProjectProgress, getProjectSnapshot } from "@/lib/project";
import Step6Client from "./Step6Client";

export default async function Step6Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [profile, snapshot, progress] = await Promise.all([
    getProfile(),
    getProjectSnapshot(id),
    getProjectProgress(id),
  ]);

  if (!profile) redirect("/login");

  const myProfileId = String(profile.id);

  // 評価軸は「チームで共有された望み」だけ。
  // 個人の下書きまで軸にすると、メンバーごとに違うものさしで採点することになる。
  const desires = snapshot.desires
    .filter((d) => d.isShared)
    .map((d) => ({
      id: d.id,
      type: d.type,
      content: d.content,
      author: d.authorId ? snapshot.memberByProfileId.get(String(d.authorId)) ?? null : null,
    }));

  const solutions = snapshot.solutions.map((s) => ({
    id: s.id,
    name: s.name || "無題のアイデア",
    description: s.description ?? "",
    createdAt: s.createdAt,
    author: s.authorId ? snapshot.memberByProfileId.get(String(s.authorId)) ?? null : null,
    isMine: s.authorId ? String(s.authorId) === myProfileId : false,
    satisfiedDesireIds: snapshot.evaluations.filter((e) => e.solutionId === s.id).map((e) => e.desireId),
  }));

  return (
    <Step6Client
      projectId={id}
      step={progress.steps[5]}
      progress={progress}
      desires={desires}
      solutions={solutions}
    />
  );
}
