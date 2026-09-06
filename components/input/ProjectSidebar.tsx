"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaLock,
  FaProjectDiagram,
  FaRegCircle,
  FaSitemap,
  FaTh,
  FaObjectGroup,
  FaLightbulb,
  FaRegDotCircle,
  FaUsers,
  FaBrain,
} from "react-icons/fa";
import { TbChartRadar } from "react-icons/tb";
import { cn } from "@/lib/utils";
import type { ProjectProgress, StepId } from "@/lib/project";

const STEP_ICONS: Record<StepId, React.ComponentType<{ className?: string }>> = {
  step1: FaLightbulb,
  step2: FaSitemap,
  step3: FaProjectDiagram,
  step4: FaTh,
  step5: FaObjectGroup,
  step6: TbChartRadar,
};

/**
 * ステップの状態を一目で示すマーク。
 *
 * 以前はどのステップも同じ見た目で並んでいたため、
 * 「終わったのか」「次はどこか」「まだ入れないのか」が画面から読み取れず、
 * 一度離れて戻ってくると再開できなくなっていた。
 */
function StatusMark({ state }: { state: "done" | "current" | "blocked" | "todo" }) {
  if (state === "done") return <FaCheck className="text-emerald-600 shrink-0" title="完了" />;
  if (state === "current") return <FaRegDotCircle className="text-[#f97316] shrink-0 animate-pulse" title="現在地" />;
  if (state === "blocked") return <FaLock className="text-stone-300 shrink-0" title="前のステップが必要" />;
  return <FaRegCircle className="text-stone-300 shrink-0" title="未着手" />;
}

function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  // ホバー時点で先読みして、クリックからの表示を体感的に詰める
  const [warm, setWarm] = useState(false);
  return (
    <Link
      href={href}
      prefetch={warm ? true : undefined}
      onMouseEnter={() => setWarm(true)}
      onFocus={() => setWarm(true)}
      onTouchStart={() => setWarm(true)}
      className={className}
    >
      {children}
    </Link>
  );
}

export function ProjectSidebar({
  projectId,
  projectName,
  progress,
}: {
  projectId: string;
  projectName: string;
  progress: ProjectProgress;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => setIsCollapsed(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeStep = progress.steps.find((s) => pathname.includes(s.id));

  return (
    <aside
      className={cn(
        "bg-white border-r-4 border-stone-800 shrink-0 flex flex-col transition-all duration-300 ease-in-out relative",
        // 本文が長いステップ（STEP 2/3 など）では、flex の伸長でサイドバーが
        // ページ全体の高さまで引き伸ばされ、mt-auto の「ツール・管理」が
        // 画面外のはるか下に追いやられていた。
        // ヘッダー(h-16)の下に貼り付けて高さを固定し、
        // はみ出す分は内側だけでスクロールさせる。
        "md:sticky md:top-16 md:h-[calc(100vh-4rem)]",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* 開閉ボタンはスクロール領域の外に置く（内側だと縁からはみ出す分が切れる） */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-stone-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md hover:bg-stone-700 z-20"
        aria-label={isCollapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
      >
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      <div className="flex flex-col flex-1 min-h-0 md:overflow-y-auto p-4">
        {/* プロジェクト名と全体進捗 */}
        <div className="mb-6 overflow-hidden shrink-0">
          {!isCollapsed && (
            <h2 className="text-xs font-bold text-stone-400 uppercase mb-1 whitespace-nowrap">プロジェクト</h2>
          )}
          <div className={cn("font-bold text-[#f97316]", isCollapsed ? "text-xs text-center truncate" : "truncate")}>
            {isCollapsed ? projectName.substring(0, 2) : projectName}
          </div>

          <div className="mt-3">
            <div className="h-2 bg-stone-200 overflow-hidden">
              <div
                className="h-full bg-[#f97316] transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-stone-500 mt-1">
                {progress.completed} / {progress.steps.length} ステップ完了（{progress.percent}%）
              </div>
            )}
          </div>
        </div>

        {/* 次にやること — 迷ったらここに戻れば再開できる */}
        {!isCollapsed && progress.completed < progress.steps.length && (
          <NavLink
            href={progress.current.href}
            className="block mb-6 bg-orange-50 border-l-4 border-[#f97316] p-3 hover:bg-orange-100 transition-colors"
          >
            <div className="text-[10px] font-bold text-[#f97316] mb-0.5">次にやること</div>
            <div className="font-bold text-sm leading-tight">
              {progress.current.num}. {progress.current.label}
            </div>
            <div className="text-[10px] text-stone-600 mt-1 leading-snug">{progress.current.goal}</div>
          </NavLink>
        )}

        <nav className="space-y-1.5 mb-6">
          {!isCollapsed && (
            <h3 className="text-[10px] font-bold text-stone-400 mb-2 px-1 whitespace-nowrap">THINK BIGGER</h3>
          )}
          {progress.steps.map((step) => {
            const Icon = STEP_ICONS[step.id];
            const isActive = activeStep?.id === step.id;
            const state = step.done
              ? "done"
              : isActive || step.id === progress.current.id
                ? "current"
                : step.blocker
                  ? "blocked"
                  : "todo";

            return (
              <NavLink key={step.id} href={step.href}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2.5 pixel-border-sm bg-white hover:bg-stone-50 transition-colors cursor-pointer group",
                    isCollapsed && "justify-center",
                    isActive && "bg-stone-100 ring-2 ring-[#f97316]",
                    step.done && !isActive && "bg-emerald-50/50"
                  )}
                  title={isCollapsed ? `${step.num}. ${step.label}（${step.detail}）` : step.detail}
                >
                  <StatusMark state={state} />
                  {!isCollapsed && (
                    <>
                      <Icon
                        className={cn(
                          "text-base shrink-0 transition-colors",
                          step.done ? "text-emerald-600" : isActive ? "text-[#f97316]" : "text-stone-400"
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold leading-tight truncate">
                          {String(step.num).padStart(2, "0")}. {step.label}
                        </span>
                        <span className="block text-[10px] text-stone-400 truncate">{step.detail}</span>
                      </span>
                    </>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>

        <nav className="space-y-1.5 mt-auto pt-4 shrink-0 border-t-2 border-dashed border-stone-200">
          {!isCollapsed && <h3 className="text-[10px] font-bold text-stone-400 mb-2 px-1">ツール・管理</h3>}

          <NavLink href={`/dashboard/projects/${projectId}/mindmap`}>
            <div
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2.5 pixel-border-sm bg-white hover:bg-stone-50 transition-colors cursor-pointer group",
                isCollapsed && "justify-center",
                pathname.includes("mindmap") && "bg-stone-100 ring-2 ring-stone-300"
              )}
              title={isCollapsed ? "マインドマップ" : ""}
            >
              <FaBrain className="text-stone-400 text-base group-hover:text-[#f97316] transition-colors shrink-0" />
              {!isCollapsed && <span className="text-sm font-bold">マインドマップ</span>}
            </div>
          </NavLink>

          <NavLink href={`/dashboard/projects/${projectId}/members`}>
            <div
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2.5 pixel-border-sm bg-white hover:bg-stone-50 transition-colors cursor-pointer group",
                isCollapsed && "justify-center",
                pathname.includes("members") && "bg-stone-100 ring-2 ring-stone-300"
              )}
              title={isCollapsed ? "メンバー" : ""}
            >
              <FaUsers className="text-stone-500 text-base group-hover:text-[#f97316] transition-colors shrink-0" />
              {!isCollapsed && <span className="text-sm font-bold">メンバー</span>}
            </div>
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
