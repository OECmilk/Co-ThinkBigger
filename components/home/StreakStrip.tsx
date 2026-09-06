import { FaFire } from "react-icons/fa";
import { cn } from "@/lib/utils";
import type { StreakInfo } from "@/lib/streak";

/**
 * 連続日数と直近4週間の活動。
 *
 * 進捗バー（6ステップ）は長期の指標で、1日の作業では動かない。
 * 「今日1マス塗れた」が別にあると、5分の作業でも手応えが残る。
 */
export function StreakStrip({ streak }: { streak: StreakInfo }) {
  const level = (count: number) => {
    if (count === 0) return "bg-[var(--surface-3)]";
    if (count === 1) return "bg-[#fed7aa]";
    if (count <= 3) return "bg-[#fb923c]";
    if (count <= 6) return "bg-[var(--accent)]";
    return "bg-[#c2410c]";
  };

  return (
    <section className="card p-5">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-baseline gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-display text-2xl font-bold tabular",
              streak.current > 0 ? "text-[var(--accent)]" : "text-[var(--ink-3)]"
            )}
          >
            <FaFire className={streak.activeToday ? "animate-pop" : ""} />
            {streak.current}
          </span>
          <span className="text-sm font-bold">日連続</span>
          <span className="text-[11px] text-[var(--ink-3)]">
            最長 {streak.best}日 ・ 通算 {streak.totalDays}日
          </span>
        </div>

        <span
          className={cn(
            "text-[11px] font-bold px-2.5 py-1 rounded-full",
            streak.activeToday
              ? "bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok-line)]"
              : "bg-[var(--surface-3)] text-[var(--ink-2)]"
          )}
        >
          {streak.activeToday ? "今日はもう手を動かしました" : "今日はまだ記録がありません"}
        </span>
      </div>

      <div className="flex gap-[3px] flex-wrap">
        {streak.recent.map((day) => (
          <span
            key={day.day}
            title={`${day.day.slice(5).replace("-", "/")} ・ ${day.count}件`}
            className={cn("h-5 flex-1 min-w-[10px] rounded-[2px]", level(day.count))}
          />
        ))}
      </div>
      <p className="text-[10px] text-[var(--ink-3)] mt-2">直近4週間の活動</p>
    </section>
  );
}
