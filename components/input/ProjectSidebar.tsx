"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaFlag,
  FaSitemap,
  FaUsers,
  FaTh,
  FaObjectGroup,
  FaChartPie,
  FaLightbulb,
  FaHeart,
  FaProjectDiagram,
  FaBars,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { TbChartRadar, TbTriangleSquareCircle } from "react-icons/tb"; // Importing from tb for additional shapes if needed
import { cn } from "@/lib/utils";

// Define icons
// 1. Mind Map: Brain -> FaBrain
// 2. Request Analysis (Step 3? No, Step 3 is "要望分析" in the methodSteps list): Person -> Triangle with split.
//    "03. 要望分析" is currently FaUsers.
//    User wants "Triangle with split". Let's use FaProjectDiagram (often hierarchical/split) or TbTriangleSquareCircle?
//    User said "Triangle with separated line". 
//    Maybe `BiNetworkChart`? 
//    Let's stick to FaProjectDiagram or FaSitemap if closer.
//    Actually, step 3 is "要望分析" (Request Analysis). 
//    Let's use `FaProjectDiagram` as it looks like a split.
// 3. Evaluation (Step 6): Lightbulb -> Radar Chart (Pentagon).
//    "06. 評価" is currently FaChartPie.
//    User wants Radar Chart. `TbChartRadar` is perfect if available. Or `FaChartArea`.
//    I'll try to import `TbChartRadar`. If not working, I'll use `FaDrawPolygon`.

// Re-defining the steps to match the layout logic but in client component
const methodSteps = (id: string) => [
  { id: "step1", label: "01. 課題候補", icon: FaLightbulb, href: `/dashboard/projects/${id}/step1` },
  { id: "step2", label: "02. 課題分解", icon: FaSitemap, href: `/dashboard/projects/${id}/step2` },
  { id: "step3", label: "03. 要望分析", icon: FaProjectDiagram, href: `/dashboard/projects/${id}/step3` }, // Changed to FaProjectDiagram (Triangle-ish split)
  { id: "step4", label: "04. 選択マップ", icon: FaTh, href: `/dashboard/projects/${id}/step4` },
  { id: "step5", label: "05. 組み合わせ", icon: FaObjectGroup, href: `/dashboard/projects/${id}/step5` },
  { id: "step6", label: "06. 評価", icon: TbChartRadar, href: `/dashboard/projects/${id}/step6` }, // Changed to TbChartRadar
];

const manageSteps = (id: string) => [
  { id: "members", label: "メンバー管理", icon: FaUsers, href: `/dashboard/projects/${id}/members` },
];

export function ProjectSidebar({ projectId, projectName }: { projectId: string, projectName: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Responsive: Collapse on small screens (e.g. < 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const steps = methodSteps(projectId);
  const management = manageSteps(projectId);

  return (
    <aside
      className={cn(
        "bg-white border-r-4 border-stone-800 p-4 shrink-0 flex flex-col transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-stone-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md hover:bg-stone-700 z-10"
      >
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      {/* Project Header */}
      <div className="mb-8 overflow-hidden shink-0">
        <h2 className={cn("text-xs font-bold text-stone-400 uppercase mb-2 transition-opacity whitespace-nowrap", isCollapsed && "opacity-0")}>
          プロジェクト
        </h2>
        <div className={cn("font-bold text-[#f97316] transition-all", isCollapsed ? "text-xs text-center truncate" : "truncate")}>
          {isCollapsed ? projectName.substring(0, 2) + ".." : projectName}
        </div>
      </div>

      {/* Discover Section */}
      <nav className="space-y-2 mb-8">
        <h3 className={cn("text-[10px] font-bold text-stone-400 mb-2 px-2 transition-opacity whitespace-nowrap", isCollapsed && "opacity-0")}>DISCOVER</h3>
        <Link href={`/dashboard/projects/${projectId}/mindmap`}>
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded pixel-border-sm hover:bg-stone-50 transition-colors cursor-pointer bg-white group relative",
              isCollapsed ? "justify-center" : "",
              pathname.includes('mindmap') ? "bg-stone-100 ring-2 ring-stone-200" : ""
            )}
            title={isCollapsed ? "マインドマップ" : ""}
          >
            <FaHeart className={cn("text-stone-400 text-lg group-hover:text-[#f97316] transition-colors", pathname.includes('mindmap') && "text-[#f97316]")} />
            {!isCollapsed && <span className="text-sm font-bold">マインドマップ</span>}
          </div>
        </Link>
      </nav>

      {/* Method Section */}
      <nav className="space-y-2 mb-8">
        <h3 className={cn("text-[10px] font-bold text-stone-400 mb-2 px-2 transition-opacity whitespace-nowrap", isCollapsed && "opacity-0")}>THINK BIGGER</h3>
        {steps.map((step) => {
          const isActive = pathname.includes(step.id);
          return (
            <Link key={step.id} href={step.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded pixel-border-sm hover:bg-stone-50 transition-colors cursor-pointer bg-white group",
                  isCollapsed ? "justify-center" : "",
                  isActive ? "bg-stone-100 ring-2 ring-stone-200" : ""
                )}
                title={isCollapsed ? step.label : ""}
              >
                <step.icon className={cn("text-stone-400 text-lg group-hover:text-[#f97316] transition-colors", isActive && "text-[#f97316]")} />
                {!isCollapsed && <span className="text-sm font-bold">{step.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Management Section */}
      <nav className={cn("space-y-2 mt-auto md:mt-0 pt-4 md:pt-4 border-t-2 border-dashed border-stone-200", isCollapsed && "border-none pt-2")}>
        <h3 className={cn("text-[10px] font-bold text-stone-400 mb-2 px-2 transition-opacity whitespace-nowrap", isCollapsed && "opacity-0")}>管理</h3>
        {management.map((step) => {
          const isActive = pathname.includes(step.id);
          return (
            <Link key={step.id} href={step.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded pixel-border-sm hover:bg-stone-50 transition-colors cursor-pointer bg-white group",
                  isCollapsed ? "justify-center" : "",
                  isActive ? "bg-stone-100 ring-2 ring-stone-200" : ""
                )}
                title={isCollapsed ? step.label : ""}
              >
                <step.icon className={cn("text-stone-700 text-lg group-hover:text-[#f97316] transition-colors", isActive && "text-[#f97316]")} />
                {!isCollapsed && <span className="text-sm font-bold">{step.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
