import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getProjectProgress, getProjectSnapshot } from "@/lib/project";
import Step4Client from "./Step4Client";

export default async function Step4Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [profile, snapshot, progress] = await Promise.all([
    getProfile(),
    getProjectSnapshot(id),
    getProjectProgress(id),
  ]);

  if (!profile) redirect("/login");

  const myProfileId = String(profile.id);

  // 選択マップの「行」は、チームが合意した（＝共有済みの）サブ課題だけ。
  // 以前は他のメンバーの個人メモまで行として並んでいて、
  // 誰の何に対して事例を集めているのか分からなくなっていた。
  const rows = snapshot.subProblems
    .filter((s) => s.isShared)
    .map((sub) => ({
      id: sub.id,
      title: sub.title,
      choices: snapshot.choices
        .filter((c) => c.subProblemId === sub.id)
        .map((c) => ({
          id: c.id,
          title: c.title,
          sourceURL: c.sourceURL,
          isOutsideDomain: c.isOutsideDomain,
          isShared: c.isShared,
          createdAt: c.createdAt,
          author: c.authorId ? snapshot.memberByProfileId.get(String(c.authorId)) ?? null : null,
          isMine: String(c.authorId) === myProfileId,
        })),
    }));

  return (
    <Step4Client
      projectId={id}
      step={progress.steps[3]}
      progress={progress}
      mainProblem={snapshot.description}
      rows={rows}
    />
  );
}
