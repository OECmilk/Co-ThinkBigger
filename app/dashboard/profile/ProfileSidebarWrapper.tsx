
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FaFlag, FaSitemap, FaUsers, FaTh, FaObjectGroup, FaChartPie, FaLightbulb, FaHome } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";

export function ProfileSidebarWrapper() {
  const searchParams = useSearchParams();
  // Get projectId from searchParams if available
  const projectId = searchParams.get("projectId");
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      if (projectId) {
        const supabase = createClient();
        const { data } = await supabase.from('Project').select('name').eq('id', projectId).single();
        if (data) setProjectName(data.name);
      }
    }
    fetchProject();
  }, [projectId]);

  // Define steps
  // If projectId is present, show Project Sidebar
  // If NOT present, show Generic Sidebar (Dashboard Home)

  if (projectId) {
    // THINK BIGGER Methodology Steps
    const methodSteps = [
      { id: "step1", label: "01. 課題発見", icon: FaLightbulb, href: `/dashboard/projects/${projectId}/step1` },
      { id: "step2", label: "02. 課題分解", icon: FaSitemap, href: `/dashboard/projects/${projectId}/step2` },
      { id: "step3", label: "03. 要望分析", icon: FaUsers, href: `/dashboard/projects/${projectId}/step3` },
      { id: "step4", label: "04. 選択マップ", icon: FaTh, href: `/dashboard/projects/${projectId}/step4` },
      { id: "step5", label: "05. 組み合わせ", icon: FaObjectGroup, href: `/dashboard/projects/${projectId}/step5` },
      { id: "step6", label: "06. 評価", icon: FaChartPie, href: `/dashboard/projects/${projectId}/step6` },
    ];

    const manageSteps = [
      { id: "members", label: "メンバー管理", icon: FaUsers, href: `/dashboard/projects/${projectId}/members` },
    ];

    return (
      <aside className="hidden md:flex w-64 bg-white border-r-4 border-stone-800 p-4 shrink-0 flex-col">
        <div className="mb-8">
          <h2 className="text-xs font-bold text-stone-400 uppercase mb-2">プロジェクト</h2>
          <div className="font-bold truncate text-[#f97316]">{projectName || 'Loading...'}</div>
        </div>

        <nav className="space-y-2 mb-8">
          <h3 className="text-[10px] font-bold text-stone-400 mb-2 px-2">DISCOVER</h3>
          <Link href={`/dashboard/projects/${projectId}/mindmap`}>
            <div className="flex items-center gap-3 px-4 py-3 rounded pixel-border-sm hover:bg-stone-50 transition-colors cursor-pointer bg-white">
              <FaLightbulb className="text-stone-400" />
              <span className="text-sm font-bold">マインドマップ</span>
            </div>
          </Link>
        </nav>

        <nav className="space-y-2 mb-8">
          <h3 className="text-[10px] font-bold text-stone-400 mb-2 px-2">THINK BIGGER</h3>
          {methodSteps.map((step) => (
            <Link key={step.id} href={step.href}>
              <div className={cn("flex items-center gap-3 px-4 py-3 rounded pixel-border-sm hover:bg-stone-50 transition-colors cursor-pointer bg-white")}>
                <step.icon className="text-stone-400" />
                <span className="text-sm font-bold">{step.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <nav className="space-y-2 mt-auto md:mt-0 pt-4 md:pt-4 border-t-2 border-dashed border-stone-200">
          <h3 className="text-[10px] font-bold text-stone-400 mb-2 px-2">管理</h3>
          {manageSteps.map((step) => (
            <Link key={step.id} href={step.href}>
              <div className={cn("flex items-center gap-3 px-4 py-3 rounded pixel-border-sm hover:bg-stone-50 transition-colors cursor-pointer bg-white")}>
                <step.icon className="text-stone-700" />
                <span className="text-sm font-bold">{step.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </aside>
    );
  }

  // Generic Sidebar if no project context
  return (
    <aside className="hidden md:flex w-64 bg-white border-r-4 border-stone-800 p-4 shrink-0 flex-col">
      <div className="mb-8">
        <h2 className="text-xs font-bold text-stone-400 uppercase mb-2">メインメニュー</h2>
      </div>
      <nav className="space-y-2">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 px-4 py-3 rounded pixel-border-sm hover:bg-stone-50 transition-colors cursor-pointer bg-white">
            <FaHome className="text-stone-400" />
            <span className="text-sm font-bold">プロジェクト一覧</span>
          </div>
        </Link>
      </nav>
    </aside>
  );
}
