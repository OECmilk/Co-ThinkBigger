"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaMagic, FaCheck, FaTimes, FaRedo, FaPlug, FaArrowRight } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { PixelButton } from "@/components/ui/PixelButton";
import { useFeedback } from "@/components/ui/Feedback";
import { adopt, suggest, type AdoptRequest, type SuggestRequest, type Suggestion } from "@/app/dashboard/projects/[id]/ai-actions";

/**
 * 「AIに出してもらう → 選ぶ → 自分の下書きになる」の共通部品。
 *
 * 設計上の要点は、AI の出力を直接データに入れないこと。
 * THINK BIGGER は本人が選び取る過程に意味があるので、
 * 提案はあくまで候補として並べ、チェックしたものだけを保存する。
 * そのぶん「思いつかなくて手が止まる」ことは無くなる。
 */

type Props = {
  projectId: string;
  aiReady: boolean;
  /** 提案パネルの見出し */
  title: string;
  triggerLabel: string;
  buildRequest: () => SuggestRequest;
  buildAdopt: (selected: Suggestion[]) => AdoptRequest;
  /** 提案を出す前に置く補助 UI（ニュースの切り口選択など） */
  header?: React.ReactNode;
  /** 採用が「1件だけ選ぶ」形式か */
  single?: boolean;
  /** 外側から開かせたいときに値を変える（ニュース見出しを種にした時など） */
  autoOpenKey?: number;
  className?: string;
  compact?: boolean;
};

export function AiSuggest({
  projectId,
  aiReady,
  title,
  triggerLabel,
  buildRequest,
  buildAdopt,
  header,
  single = false,
  autoOpenKey,
  className,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adopting, setAdopting] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useFeedback();

  const load = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await suggest(projectId, buildRequest());
      if (res.error) {
        setErrorMsg(res.error);
        setItems([]);
      } else {
        setItems(res.suggestions ?? []);
        setPicked(new Set());
      }
    } catch {
      setErrorMsg("AIの呼び出しに失敗しました。時間をおいてお試しください。");
    } finally {
      setLoading(false);
    }
  };

  const openAndLoad = () => {
    setOpen(true);
    if (items.length === 0) load();
  };

  // 外側のきっかけ（ニュース見出しを「種にする」等）で開き、その条件で出し直す
  const lastAutoOpen = useRef(autoOpenKey);
  useEffect(() => {
    if (autoOpenKey === undefined || autoOpenKey === lastAutoOpen.current) return;
    lastAutoOpen.current = autoOpenKey;
    setOpen(true);
    load();
    // load は毎レンダーで作り直されるので依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenKey]);

  const toggle = (index: number) => {
    setPicked((prev) => {
      if (single) return new Set(prev.has(index) ? [] : [index]);
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const handleAdopt = async () => {
    const selected = [...picked].sort().map((i) => items[i]);
    if (selected.length === 0) return;

    setAdopting(true);
    try {
      const res = await adopt(projectId, buildAdopt(selected));
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      toast(`${res.added ?? selected.length}件を自分の下書きに追加しました`, "success");
      setOpen(false);
      setItems([]);
      setPicked(new Set());
    } catch {
      toast("追加に失敗しました。", "error");
    } finally {
      setAdopting(false);
    }
  };

  /* ---------- 未接続 ---------- */
  if (!aiReady) {
    return (
      <div className={cn("flex items-center gap-3 flex-wrap text-xs", className)}>
        <span className="inline-flex items-center gap-2 text-[var(--ink-3)]">
          <FaMagic /> 思いつかないときは AI に相談できます
        </span>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 font-bold text-[var(--accent-ink)] hover:underline"
        >
          <FaPlug /> AIを接続する <FaArrowRight className="text-[9px]" />
        </Link>
      </div>
    );
  }

  /* ---------- トリガー ---------- */
  if (!open) {
    return (
      <button
        onClick={openAndLoad}
        className={cn(
          "press inline-flex items-center gap-2 font-bold rounded-[3px] border-2 border-dashed",
          "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)]",
          "hover:border-[var(--accent)] hover:bg-white transition-colors",
          compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-sm",
          className
        )}
      >
        <FaMagic className={compact ? "text-[10px]" : ""} />
        {triggerLabel}
      </button>
    );
  }

  /* ---------- 提案パネル ---------- */
  return (
    <div
      className={cn(
        "animate-rise border-2 border-[var(--accent-line)] bg-[var(--accent-soft)] rounded-[6px] overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-[var(--accent-line)]">
        <h4 className="font-bold text-sm flex items-center gap-2 min-w-0">
          <FaMagic className="text-[var(--accent)] shrink-0" />
          <span className="truncate">{title}</span>
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={load}
            disabled={loading}
            className="p-2 text-[var(--ink-3)] hover:text-[var(--accent)] disabled:opacity-40"
            title="出し直す"
          >
            {loading ? <Spinner size={11} /> : <FaRedo size={11} />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-[var(--ink-3)] hover:text-[var(--ink)]"
            title="閉じる"
          >
            <FaTimes size={13} />
          </button>
        </div>
      </div>

      {header && <div className="px-4 py-3 bg-white/70 border-b border-[var(--accent-line)]">{header}</div>}

      <div className="p-4 space-y-3">
        {loading && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--ink-2)] flex items-center gap-2">
              <Spinner size={11} /> あなたのプロジェクトの内容を読んで考えています…
            </p>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        )}

        {!loading && errorMsg && (
          <div className="text-xs bg-white border border-[var(--danger)] text-[var(--danger)] rounded p-3 space-y-2">
            <p className="font-bold">{errorMsg}</p>
            <div className="flex gap-2">
              <PixelButton size="sm" variant="secondary" onClick={load}>
                もう一度
              </PixelButton>
              <Link href="/dashboard/settings">
                <PixelButton size="sm" variant="ghost">
                  AI設定を見る
                </PixelButton>
              </Link>
            </div>
          </div>
        )}

        {!loading && !errorMsg && items.length > 0 && (
          <>
            <p className="text-[11px] text-[var(--ink-2)]">
              {single ? "採用するものを1つ選んでください。" : "使えそうなものにチェックを入れてください。そのまま自分の下書きになります。"}
            </p>

            <ul className="space-y-2">
              {items.map((item, index) => {
                const isPicked = picked.has(index);
                return (
                  <li key={index}>
                    <button
                      onClick={() => toggle(index)}
                      className={cn(
                        "w-full text-left p-3 rounded-[4px] border-2 transition-all flex gap-3 items-start bg-white",
                        isPicked
                          ? "border-[var(--accent)] shadow-[2px_2px_0_0_var(--accent)]"
                          : "border-[var(--line)] hover:border-[var(--ink-3)]"
                      )}
                      aria-pressed={isPicked}
                    >
                      <span
                        className={cn(
                          "w-5 h-5 shrink-0 mt-0.5 border-2 rounded-[2px] flex items-center justify-center text-[10px]",
                          isPicked
                            ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                            : "border-[var(--line)]"
                        )}
                      >
                        {isPicked && <FaCheck />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold leading-snug break-words">{item.text}</span>
                        {item.why && (
                          <span className="block text-[11px] text-[var(--ink-2)] mt-1 leading-relaxed break-words">
                            {item.why}
                          </span>
                        )}
                        {item.domain && (
                          <span className="inline-block mt-1.5 text-[10px] font-bold bg-[var(--purple-soft)] text-[var(--purple)] px-1.5 py-0.5 rounded">
                            {item.domain}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-[var(--ink-2)]">
                {picked.size > 0 ? `${picked.size}件を選択中` : "まだ選ばれていません"}
              </span>
              <PixelButton size="sm" onClick={handleAdopt} disabled={picked.size === 0} loading={adopting}>
                {single ? "これに決める" : "選んだものを追加"}
              </PixelButton>
            </div>
          </>
        )}

        {!loading && !errorMsg && items.length === 0 && (
          <p className="text-xs text-[var(--ink-3)] py-4 text-center">提案がありませんでした。</p>
        )}
      </div>
    </div>
  );
}
