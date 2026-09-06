import { redirect } from "next/navigation";
import { getProjectProgress } from "@/lib/project";

/**
 * プロジェクトを開いたら、STEP 1 固定ではなく「次にやるべきステップ」へ送る。
 * 期間が空いてから戻ってきても、続きから再開できるようにするため。
 */
export default async function ProjectIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const progress = await getProjectProgress(id);
  redirect(progress.current.href);
}
