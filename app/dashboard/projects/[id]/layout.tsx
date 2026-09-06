import { getProjectMembership, getUser } from "@/lib/auth";
import { getProjectProgress, getProjectSnapshot } from "@/lib/project";
import { redirect, notFound } from "next/navigation";
import { ProjectSidebar } from "@/components/input/ProjectSidebar";
import { ProjectRealtime } from "@/components/project/ProjectRealtime";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getUser();
  if (!user) redirect("/login");

  const [member, snapshot] = await Promise.all([getProjectMembership(id), getProjectSnapshot(id)]);
  if (!member) notFound();

  // スナップショットは配下のページでも使い回されるため、ここでの取得は 1 回きり
  const progress = await getProjectProgress(id);

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-64px)]">
      <ProjectSidebar projectId={id} projectName={snapshot.name} progress={progress} />

      <div className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">{children}</div>

      {/* 他のメンバーの変更を自動で取り込む */}
      <ProjectRealtime projectId={id} />
    </div>
  );
}
