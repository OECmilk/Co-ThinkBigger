"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FaArrowLeft, FaHome } from "react-icons/fa";

/**
 * プロフィール画面のサイドナビ。
 *
 * 以前はここに 6 ステップのリンクをもう一組ハードコードしていて、
 * ProjectSidebar と二重管理になっていた（ラベルもすでにズレていた）。
 * プロフィールで必要なのは「元いた場所に戻る」導線だけなので、それだけにする。
 */
export function ProfileSidebarWrapper() {
  const projectId = useSearchParams().get("projectId");

  return (
    <aside className="hidden md:flex w-56 bg-white border-r-4 border-stone-800 p-4 shrink-0 flex-col gap-2">
      <h2 className="text-xs font-bold text-stone-400 uppercase mb-2">メニュー</h2>

      {projectId && (
        <Link href={`/dashboard/projects/${projectId}`}>
          <div className="flex items-center gap-3 px-3 py-3 pixel-border-sm bg-white hover:bg-stone-50 transition-colors cursor-pointer">
            <FaArrowLeft className="text-[#f97316] shrink-0" />
            <span className="text-sm font-bold">プロジェクトに戻る</span>
          </div>
        </Link>
      )}

      <Link href="/dashboard">
        <div className="flex items-center gap-3 px-3 py-3 pixel-border-sm bg-white hover:bg-stone-50 transition-colors cursor-pointer">
          <FaHome className="text-stone-400 shrink-0" />
          <span className="text-sm font-bold">プロジェクト一覧</span>
        </div>
      </Link>
    </aside>
  );
}
