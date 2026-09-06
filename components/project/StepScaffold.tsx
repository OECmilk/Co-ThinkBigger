import Link from "next/link";
import { FaArrowRight, FaArrowLeft, FaCheckCircle, FaFlagCheckered, FaLock, FaRegCircle } from "react-icons/fa";
import { cn } from "@/lib/utils";
import type { ProjectProgress, StepId, StepProgress } from "@/lib/project";

/**
 * 各ステップ画面の骨組み。
 *
 * 「今どこにいて」「このステップは何をもって終わりで」「次に何をするか」を
 * 全ステップで同じ形に固定する。ここが揃っていないと、
 * 手順の多い手法は途中で迷子になって止まってしまう。
 */

export function StepHeader({
  step,
  description,
  actions,
}: {
  step: StepProgress;
  description: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 pixel-border-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
            <span className="text-[#f97316]">STEP {String(step.num).padStart(2, "0")}</span>
            <span>{step.label}</span>
            {step.done && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                <FaCheckCircle /> 完了条件を満たしています
              </span>
            )}
          </h2>
          <p className="text-stone-600 text-sm leading-relaxed">{description}</p>
        </div>
        {actions}
      </div>

      {/* このステップのゴール — 常に目に入る位置に置く */}
      <div
        className={cn(
          "flex items-start gap-3 p-3 text-sm border-l-4",
          step.done ? "bg-emerald-50 border-emerald-500" : "bg-orange-50 border-[#f97316]"
        )}
      >
        <FaFlagCheckered className={cn("mt-0.5 shrink-0", step.done ? "text-emerald-600" : "text-[#f97316]")} />
        <div className="min-w-0">
          <div className="font-bold">このステップのゴール</div>
          <div className="text-stone-700">{step.goal}</div>
          <div className="text-xs text-stone-500 mt-1">現在: {step.detail}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 前提が満たされていないときに出す案内。
 * 「空っぽの画面」ではなく「なぜ空で、どこへ戻ればいいか」を必ず示す。
 */
export function BlockerNotice({
  blocker,
  steps,
}: {
  blocker: { message: string; goTo: StepId };
  steps: StepProgress[];
}) {
  const target = steps.find((s) => s.id === blocker.goTo);
  if (!target) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <FaLock className="text-amber-500 mt-1 shrink-0" />
        <div>
          <p className="font-bold text-amber-900">{blocker.message}</p>
          <p className="text-sm text-amber-800 mt-1">
            先に <span className="font-bold">STEP {target.num} {target.label}</span> を進めてください。
          </p>
        </div>
      </div>
      <Link href={target.href} className="shrink-0">
        <span className="inline-flex items-center gap-2 bg-stone-800 text-white font-bold text-sm px-4 py-2 pixel-border-sm hover:bg-stone-700 transition-colors">
          STEP {target.num} へ移動 <FaArrowRight />
        </span>
      </Link>
    </div>
  );
}

/** データが無いときの空状態。行動を 1 つだけ示す。 */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12 px-6 border-2 border-dashed border-stone-300 bg-white/60 space-y-3">
      <p className="font-bold text-stone-600">{title}</p>
      {hint && <p className="text-sm text-stone-500 leading-relaxed">{hint}</p>}
      {action && <div className="pt-2 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * 画面末尾の前後ナビゲーション。
 * 「次に何をするか」を毎ステップの最後で必ず提示して、手が止まらないようにする。
 */
export function StepFooterNav({ progress, current }: { progress: ProjectProgress; current: StepId }) {
  const index = progress.steps.findIndex((s) => s.id === current);
  const prev = index > 0 ? progress.steps[index - 1] : null;
  const next = index < progress.steps.length - 1 ? progress.steps[index + 1] : null;
  const step = progress.steps[index];

  return (
    <div className="mt-12 pt-6 border-t-2 border-dashed border-stone-300 space-y-4">
      {!step.done && (
        <p className="text-sm text-stone-500 flex items-center gap-2">
          <FaRegCircle className="text-stone-400" />
          このステップはまだ完了条件を満たしていません（{step.detail}）。先に進むこともできます。
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {prev ? (
          <Link href={prev.href} className="group">
            <span className="inline-flex items-center gap-3 bg-white pixel-border-sm px-4 py-3 hover:bg-stone-50 transition-colors w-full sm:w-auto">
              <FaArrowLeft className="text-stone-400 group-hover:text-[#f97316] transition-colors" />
              <span className="text-left">
                <span className="block text-[10px] font-bold text-stone-400">前のステップ</span>
                <span className="block font-bold text-sm">
                  {prev.num}. {prev.label}
                </span>
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link href={next.href} className="group">
            <span className="inline-flex items-center gap-3 bg-stone-800 text-white pixel-border-sm px-5 py-3 hover:bg-stone-700 transition-colors w-full sm:w-auto justify-between">
              <span className="text-left">
                <span className="block text-[10px] font-bold text-stone-400">次のステップ</span>
                <span className="block font-bold text-sm">
                  {next.num}. {next.label}
                </span>
              </span>
              <FaArrowRight className="text-[#f97316]" />
            </span>
          </Link>
        ) : (
          <Link href={`/dashboard/projects/${progress.steps[0].href.split("/")[3]}`} className="group">
            <span className="inline-flex items-center gap-3 bg-emerald-600 text-white pixel-border-sm px-5 py-3 hover:bg-emerald-700 transition-colors">
              <FaFlagCheckered />
              <span className="font-bold text-sm">THINK BIGGER 完走！最初から見直す</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
