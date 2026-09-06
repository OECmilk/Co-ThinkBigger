import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getProjectProgress, getProjectSnapshot } from "@/lib/project";
import Step2Client from "./Step2Client";

export default async function Step2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [profile, snapshot, progress] = await Promise.all([
    getProfile(),
    getProjectSnapshot(id),
    getProjectProgress(id),
  ]);

  if (!profile) redirect("/login");

  const myProfileId = String(profile.id);

  const subProblems = snapshot.subProblems.map((s) => ({
    id: s.id,
    title: s.title,
    isShared: s.isShared,
    createdAt: s.createdAt,
    authorId: s.authorId ? String(s.authorId) : null,
    author: s.authorId ? snapshot.memberByProfileId.get(String(s.authorId)) ?? null : null,
    isMine: String(s.authorId) === myProfileId,
  }));

  return (
    <Step2Client
      projectId={id}
      step={progress.steps[1]}
      progress={progress}
      mainProblem={snapshot.description}
      subProblems={subProblems}
    />
  );
}
