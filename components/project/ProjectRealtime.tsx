"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FaSyncAlt } from "react-icons/fa";

/**
 * 他のメンバーの変更を、リロードなしで自分の画面に反映する。
 *
 * これまでリアルタイム購読はチャットだけだった。
 * 離れて同じプロジェクトを触っていると、
 * 「相手の追加が見えない」「消したはずのものが残る」が普通に起きて、
 * 二重投稿や噛み合わない議論の原因になる。
 *
 * プロジェクト配下の layout に置いて、全ステップに一括で効かせる。
 */

// projectId 列を持つテーブルは購読側で絞る。
const SCOPED_TABLES = ["Candidate", "SubProblem", "Desire", "Solution", "Message", "ProjectMember"];
// 親を辿らないと projectId が分からないテーブルは、全体を購読して再取得に任せる。
const UNSCOPED_TABLES = ["Reaction", "Choice", "Evaluation"];

export function ProjectRealtime({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [justUpdated, setJustUpdated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // 立て続けの変更で refresh が連打されないよう、少しまとめてから反映する
    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        router.refresh();
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 1800);
      }, 400);
    };

    // チャンネル名をプロジェクトごとに分ける（固定名だと画面間で衝突する）
    const channel = supabase.channel(`project-sync-${projectId}`);

    SCOPED_TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `projectId=eq.${projectId}` },
        scheduleRefresh
      );
    });

    UNSCOPED_TABLES.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh);
    });

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "Project", filter: `id=eq.${projectId}` },
      scheduleRefresh
    );

    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [projectId, router]);

  if (!justUpdated) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[190] flex items-center gap-2 bg-stone-800 text-white text-xs font-bold px-3 py-2 pixel-border-sm">
      <FaSyncAlt className="animate-spin" />
      チームの変更を反映しました
    </div>
  );
}
