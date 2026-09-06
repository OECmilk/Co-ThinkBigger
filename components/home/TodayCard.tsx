"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowRight, FaBolt, FaCheckCircle, FaMagic, FaPlus, FaFlagCheckered } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { PixelButton } from "@/components/ui/PixelButton";
import { Spinner } from "@/components/ui/Spinner";
import { useFeedback } from "@/components/ui/Feedback";
import { quickAdd } from "@/app/dashboard/actions";
import { getDailyNudge } from "@/app/dashboard/projects/[id]/ai-actions";

/**
 * ホームの主役。「今日ここに1行書けば前に進む」を1枚で完結させる。
 *
 * 以前のホームはプロジェクトのカードが並ぶだけで、
 * 開いてから実際に何かを書くまでに 2〜3 クリックあった。
 * その手間が、毎日ひらかない一番の理由になる。
 */

const QUICK_PLACEHOLDER: Record<string, string> = {
  step1: "思いついた課題を1つ（例: どうすれば◯◯できるだろうか？）",
  step2: "サブ課題を1つ（メイン課題を解くために解くべきこと）",
  step3: "あなた自身の望みを1つ（〜したい / 〜されたくない）",
};

export function TodayCard({
  projectId,
  projectName,
  stepId,
  stepNum,
  stepLabel,
  stepGoal,
  stepDetail,
  href,
  aiReady,
  finished,
}: {
  projectId: string;
  projectName: string;
  stepId: string;
  stepNum: number;
  stepLabel: string;
  stepGoal: string;
  stepDetail: string;
  href: string;
  aiReady: boolean;
  finished: boolean;
}) {
  const [text, setText] = useState("");
  const [nudge, setNudge] = useState<string | null>(null);
  const [nudgeError, setNudgeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingNudge, startNudge] = useTransition();
  const { toast } = useFeedback();
  const router = useRouter();

  const canQuickAdd = !finished && !!QUICK_PLACEHOLDER[stepId];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;

    startTransition(async () => {
      const res = await quickAdd(projectId, stepId, value);
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      setText("");
      toast("書き留めました。今日の記録に入りました", "success");
      res.unlocked?.forEach((b) => toast(`${b.icon} 実績「${b.label}」を獲得しました！`, "success"));
      router.refresh();
    });
  };

  const askNudge = () => {
    startNudge(async () => {
      setNudgeError(null);
      const res = await getDailyNudge(projectId);
      if (res.error) setNudgeError(res.error);
      else setNudge(res.text ?? null);
    });
  };

  return (
    <section className="card-raised p-6 space-y-5 animate-rise">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--accent-ink)] uppercase font-display">
            {finished ? "Completed" : "Today"}
          </p>
          <h2 className="text-xl font-bold mt-1 break-words">
            {finished ? "全ステップ完了しています" : stepGoal}
          </h2>
          <p className="text-xs text-[var(--ink-2)] mt-1.5">
            <Link href={`/dashboard/projects/${projectId}`} className="font-bold hover:text-[var(--accent)]">
              {projectName}
            </Link>
            <span className="mx-1.5 text-[var(--ink-3)]">/</span>
            STEP {String(stepNum).padStart(2, "0")} {stepLabel}
            <span className="mx-1.5 text-[var(--ink-3)]">/</span>
            {stepDetail}
          </p>
        </div>

        <Link href={href} className="shrink-0">
          <PixelButton size="sm" variant="secondary">
            {finished ? <FaFlagCheckered /> : null}
            ステップを開く <FaArrowRight className="text-[10px]" />
          </PixelButton>
        </Link>
      </div>

      {/* その場で1行書ける。ここが毎日の入口 */}
      {canQuickAdd && (
        <form onSubmit={submit} className="flex gap-2 items-stretch">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={QUICK_PLACEHOLDER[stepId]}
            className="flex-1 min-w-0 bg-white border-2 border-[var(--line-strong)] rounded-[3px] px-3 py-2.5 text-sm focus:outline-none focus:bg-[var(--accent-soft)] transition-colors"
          />
          <PixelButton type="submit" disabled={!text.trim()} loading={isPending} className="shrink-0">
            {!isPending && <FaPlus />}
            書き留める
          </PixelButton>
        </form>
      )}

      {finished && (
        <p className="text-sm text-[var(--ink-2)] flex items-center gap-2">
          <FaCheckCircle className="text-[var(--ok)]" />
          6つのステップをやり切りました。別の課題で新しいプロジェクトを始めることもできます。
        </p>
      )}

      {/* AIの今日の一手 */}
      {!finished && (
        <div className="pt-1">
          {nudge ? (
            <div className="flex items-start gap-2.5 text-sm bg-[var(--accent-soft)] border border-[var(--accent-line)] rounded-[4px] p-3 animate-rise">
              <FaBolt className="text-[var(--accent)] mt-0.5 shrink-0" />
              <p className="leading-relaxed break-words">{nudge}</p>
            </div>
          ) : nudgeError ? (
            <p className="text-xs text-[var(--ink-3)]">{nudgeError}</p>
          ) : aiReady ? (
            <button
              onClick={askNudge}
              disabled={loadingNudge}
              className={cn(
                "inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-[3px] border-2 border-dashed transition-colors",
                "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:border-[var(--accent)] hover:bg-white"
              )}
            >
              {loadingNudge ? <Spinner size={10} /> : <FaMagic />}
              {loadingNudge ? "考えています…" : "今日の一手をAIに聞く"}
            </button>
          ) : (
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink-3)] hover:text-[var(--accent-ink)]"
            >
              <FaMagic /> AIを接続すると、今日の一手を提案してくれます
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
