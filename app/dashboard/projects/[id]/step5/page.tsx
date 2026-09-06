import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getProjectProgress, getProjectSnapshot } from "@/lib/project";
import Step5Client from "./Step5Client";

export default async function Step5Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [profile, snapshot, progress] = await Promise.all([
    getProfile(),
    getProjectSnapshot(id),
    getProjectProgress(id),
  ]);

  if (!profile) redirect("/login");

  const myProfileId = String(profile.id);

  // 組み合わせの材料は「チームが共有したサブ課題」×「チームが共有した事例」だけ。
  // 個人の下書きが混ざると、他のメンバーには意味の分からない解決策ができてしまう。
  const rows = snapshot.subProblems
    .filter((s) => s.isShared)
    .map((sub) => ({
      id: sub.id,
      title: sub.title,
      choices: snapshot.choices
        .filter((c) => c.subProblemId === sub.id && c.isShared)
        .map((c) => ({
          id: c.id,
          title: c.title,
          isOutsideDomain: c.isOutsideDomain,
          sourceURL: c.sourceURL,
        })),
    }));

  const choiceTitles: Record<string, string> = {};
  snapshot.choices.forEach((c) => {
    choiceTitles[c.id] = c.title;
  });

  const solutions = snapshot.solutions.map((s) => ({
    id: s.id,
    name: s.name || "無題のアイデア",
    description: s.description ?? "",
    components: (s.components || {}) as Record<string, string>,
    createdAt: s.createdAt,
    author: s.authorId ? snapshot.memberByProfileId.get(String(s.authorId)) ?? null : null,
    isMine: s.authorId ? String(s.authorId) === myProfileId : false,
  }));

  return (
    <Step5Client
      projectId={id}
      step={progress.steps[4]}
      progress={progress}
      rows={rows}
      solutions={solutions}
      choiceTitles={choiceTitles}
    />
  );
}
