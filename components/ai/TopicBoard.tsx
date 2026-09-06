"use client";

import { useEffect, useState, useTransition } from "react";
import { FaExternalLinkAlt, FaNewspaper, FaSyncAlt } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { loadTopics } from "@/app/dashboard/projects/[id]/ai-actions";
import { TOPIC_PRESETS } from "@/lib/news";
import type { Topic } from "@/lib/news";

/**
 * 世の中で起きていることを並べる板。
 *
 * 「課題候補が思いつかない」の多くは発想力の問題ではなく、
 * 材料が目の前に無いだけ。外の話題を眺めているうちに
 * 「これ自分の周りでもあるな」が出てくる。
 * AI 未接続でも使えるようにしてあるので、ここだけでも十分に効く。
 */
export function TopicBoard({
  onPick,
  className,
}: {
  onPick?: (title: string) => void;
  className?: string;
}) {
  const [preset, setPreset] = useState<string>(TOPIC_PRESETS[0].id);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      setTopics(await loadTopics(preset));
      setLoaded(true);
    });
  }, [preset]);

  return (
    <section className={cn("card p-5 space-y-4", className)}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <FaNewspaper className="text-[var(--accent)]" /> 世の中のいま
          </h3>
          <p className="text-xs text-[var(--ink-2)] mt-1 leading-relaxed">
            白紙から考えるより、外の話題を眺める方が早く出ます。気になった見出しを課題の種にしてください。
          </p>
        </div>
        <button
          onClick={() => startTransition(async () => setTopics(await loadTopics(preset)))}
          className="p-2 text-[var(--ink-3)] hover:text-[var(--accent)] shrink-0"
          title="更新"
          disabled={isPending}
        >
          {isPending ? <Spinner size={12} /> : <FaSyncAlt size={12} />}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TOPIC_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-bold rounded-full border-2 transition-colors",
              preset === p.id
                ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                : "bg-white border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--ink-3)]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isPending && topics.length === 0 && (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-9" />
          ))}
        </div>
      )}

      {!isPending && loaded && topics.length === 0 && (
        <p className="text-xs text-[var(--ink-3)] py-4 text-center">
          いまトピックを取得できませんでした。時間をおいてお試しください。
        </p>
      )}

      <ul className="divide-y divide-[var(--line)]">
        {topics.map((topic, i) => (
          <li key={i} className="py-2 flex items-start gap-3 group">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug break-words">{topic.title}</p>
              <p className="text-[10px] text-[var(--ink-3)] mt-0.5">{topic.source}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onPick && (
                <button
                  onClick={() => onPick(topic.title)}
                  className="text-[10px] font-bold px-2 py-1 rounded border-2 border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:border-[var(--accent)] transition-colors whitespace-nowrap"
                  title="この話題から課題を考える"
                >
                  種にする
                </button>
              )}
              {topic.link && (
                <a
                  href={topic.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-1.5 text-[var(--ink-3)] hover:text-[var(--accent)]"
                  title="記事を開く"
                >
                  <FaExternalLinkAlt size={10} />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
