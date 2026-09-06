import { getProjectMembership, getProjectMeta, getUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ProjectSidebar } from "@/components/input/ProjectSidebar";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 親の dashboard/layout.tsx で取得済みのユーザーがキャッシュから返る
  const user = await getUser();
  if (!user) redirect("/login");

  // メンバーシップ確認とプロジェクト情報は互いに依存しないので並列に取る
  const [member, project] = await Promise.all([
    getProjectMembership(id),
    getProjectMeta(id),
  ]);

  if (!member) {
    // プロジェクトが存在しない、またはユーザーがメンバーでない
    notFound();
  }

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-64px)]">
      {/* Sidebar Navigation */}
      <ProjectSidebar projectId={id} projectName={project?.name || "Project"} />

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
