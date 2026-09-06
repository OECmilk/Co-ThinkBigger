import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getProjectProgress, getProjectSnapshot } from "@/lib/project";
import Step3Client from "./Step3Client";

export default async function Step3Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [profile, snapshot, progress] = await Promise.all([
    getProfile(),
    getProjectSnapshot(id),
    getProjectProgress(id),
  ]);

  if (!profile) redirect("/login");

  const myProfileId = String(profile.id);

  const desires = snapshot.desires.map((d) => ({
    id: d.id,
    type: d.type,
    content: d.content,
    isShared: d.isShared,
    createdAt: d.createdAt,
    author: d.authorId ? snapshot.memberByProfileId.get(String(d.authorId)) ?? null : null,
    isMine: String(d.authorId) === myProfileId,
  }));

  return (
    <Step3Client
      projectId={id}
      step={progress.steps[2]}
      progress={progress}
      mainProblem={snapshot.description}
      desires={desires}
    />
  );
}
