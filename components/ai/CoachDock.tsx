"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaTimes, FaPaperPlane, FaCommentDots, FaTrash, FaPlug, FaMagic } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { PixelButton } from "@/components/ui/PixelButton";
import { clearCoachHistory, loadCoachHistory, type CoachTurn } from "@/app/dashboard/projects/[id]/ai-actions";

/**
 * どのステップからでも呼べる AI 壁打ち。
 *
 * 「難しくて手が止まる」が起きるのは、たいてい
 * 何を書けばいいか分からないときではなく、
 * 考えを口に出す相手がいないとき。
 * ステップごとに会話を分けて保存するので、
 * 数日空けても前回の続きから再開できる。
 */

const OPENERS: Record<string, string[]> = {
  step1: [
    "最近もやっとしていることを話すので、課題の形に整理するのを手伝ってほしい",
    "この分野で見落とされがちな課題は何だと思う？",
    "自分が本当に情熱を持てる課題かどうか、質問して確かめてほしい",
  ],
  step2: [
    "このメイン課題、どう分ければいい？一緒に考えて",
    "いま出しているサブ課題、粒度や重複はおかしくない？",
    "分解できているか、抜けがないかチェックしてほしい",
  ],
  step3: [
    "ターゲットの本音がうまく言葉にできない。質問して引き出してほしい",
    "第三者の視点が思いつかない。誰が影響を受ける？",
    "きれいごとになっている気がする。もっと踏み込んだ望みを一緒に探して",
  ],
  step4: [
    "同じ業界の事例しか思いつかない。遠い分野に飛ぶヒントがほしい",
    "このサブ課題、自然界や歴史に似た解き方はある？",
    "集めた事例が弱い気がする。どこを掘ればいい？",
  ],
  step5: [
    "組み合わせがしっくりこない。どう見ればいい？",
    "この組み合わせ、成立させるには何が必要？",
    "捨てようとしている組み合わせの可能性を検討したい",
  ],
  step6: [
    "点が伸びない視点がある。何を足せば満たせる？",
    "どの案を本命にすべきか、判断軸を整理したい",
    "評価が甘いかもしれない。厳しく突っ込んでほしい",
  ],
};

const STEP_LABELS: Record<string, string> = {
  step1: "STEP 1 課題候補",
  step2: "STEP 2 課題分解",
  step3: "STEP 3 要望分析",
  step4: "STEP 4 選択マップ",
  step5: "STEP 5 組み合わせ",
  step6: "STEP 6 評価",
  mindmap: "マインドマップ",
};

export function CoachDock({ projectId, aiReady }: { projectId: string; aiReady: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const step = Object.keys(STEP_LABELS).find((s) => pathname.includes(s)) ?? "step1";

  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<CoachTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadedStep, setLoadedStep] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const refresh = useCallback(async () => {
    setTurns(await loadCoachHistory(projectId, step));
    setLoadedStep(step);
  }, [projectId, step]);

  useEffect(() => {
    if (open && loadedStep !== step) refresh();
  }, [open, step, loadedStep, refresh]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, partial, open]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || streaming) return;

    setDraft("");
    setErrorMsg(null);
    setStreaming(true);
    setPartial("");

    // 送った発言はすぐ出す（返答を待つ間に会話が消えて見えないように）
    setTurns((prev) => [
      ...prev,
      { id: "local-" + Date.now(), role: "user", content: message, createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, step, message }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body?.error || "AIの呼び出しに失敗しました。");
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setPartial(acc);
      }

      setPartial("");
      await refresh();
      // 壁打ちで内容が動くことがあるので、裏の画面も最新にしておく
      router.refresh();
    } catch {
      setErrorMsg("通信に失敗しました。");
    } finally {
      setStreaming(false);
    }
  };

  const openers = OPENERS[step] ?? OPENERS.step1;

  return (
    <>
      {/* 起動ボタン（全ステップ共通の定位置） */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-5 right-5 z-[130] press",
            "inline-flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm",
            "bg-[var(--ink)] text-white border-2 border-[var(--ink)] shadow-[var(--shadow-3)]",
            "hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-colors"
          )}
        >
          <FaCommentDots />
          <span className="hidden sm:inline">AIと壁打ち</span>
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 bg-stone-900/25 backdrop-blur-[2px] z-[130]" onClick={() => setOpen(false)} />

          <aside className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-[var(--surface)] z-[140] border-l-2 border-[var(--line-strong)] flex flex-col shadow-[var(--shadow-3)]">
            <header className="px-4 py-3 border-b-2 border-[var(--line)] bg-[var(--surface-2)] flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FaMagic className="text-[var(--accent)]" /> AIコーチ
                </h3>
                <p className="text-[11px] text-[var(--ink-2)] mt-0.5 truncate">
                  {STEP_LABELS[step]} について相談中
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {turns.length > 0 && (
                  <button
                    onClick={async () => {
                      await clearCoachHistory(projectId, step);
                      setTurns([]);
                    }}
                    className="p-2 text-[var(--ink-3)] hover:text-[var(--danger)]"
                    title="この会話を消す"
                  >
                    <FaTrash size={12} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-[var(--ink-3)] hover:text-[var(--ink)]"
                  title="閉じる"
                >
                  <FaTimes />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg)]">
              {!aiReady ? (
                <div className="card p-5 text-center space-y-3">
                  <FaPlug className="text-2xl text-[var(--ink-3)] mx-auto" />
                  <p className="font-bold text-sm">AIがまだ接続されていません</p>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                    ご自身が契約している Claude / GPT / Gemini の APIキーを登録すると、
                    このプロジェクトの内容を踏まえて一緒に考えてくれます。
                  </p>
                  <Link href="/dashboard/settings">
                    <PixelButton size="sm">
                      <FaPlug /> AIを接続する
                    </PixelButton>
                  </Link>
                </div>
              ) : (
                <>
                  {turns.length === 0 && !streaming && (
                    <div className="space-y-3">
                      <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                        いまのプロジェクトの内容（メイン課題・サブ課題・望み・事例）を読んだ状態で相談できます。
                        <br />
                        何から話すか迷ったら、下のどれかを押してください。
                      </p>
                      <div className="space-y-2">
                        {openers.map((opener) => (
                          <button
                            key={opener}
                            onClick={() => send(opener)}
                            className="w-full text-left text-xs bg-white border-2 border-[var(--line)] hover:border-[var(--accent)] rounded-[4px] p-3 transition-colors leading-relaxed"
                          >
                            {opener}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {turns.map((turn) => (
                    <div
                      key={turn.id}
                      className={cn("flex", turn.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[88%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words rounded-[6px] prose-tight",
                          turn.role === "user"
                            ? "bg-[var(--ink)] text-white"
                            : "bg-white border border-[var(--line)]"
                        )}
                      >
                        {turn.content}
                      </div>
                    </div>
                  ))}

                  {partial && (
                    <div className="flex justify-start">
                      <div className="max-w-[88%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words rounded-[6px] bg-white border border-[var(--line)]">
                        {partial}
                        <span className="inline-block w-1.5 h-3.5 bg-[var(--accent)] ml-0.5 align-middle animate-pulse" />
                      </div>
                    </div>
                  )}

                  {streaming && !partial && (
                    <p className="text-xs text-[var(--ink-3)] flex items-center gap-2">
                      <Spinner size={10} /> 考えています…
                    </p>
                  )}

                  {errorMsg && (
                    <div className="text-xs bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)] rounded p-3">
                      {errorMsg}
                    </div>
                  )}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {aiReady && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(draft);
                }}
                className="p-3 border-t-2 border-[var(--line)] bg-white shrink-0"
              >
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        send(draft);
                      }
                    }}
                    placeholder="考えていることをそのまま書いてください（⌘/Ctrl+Enter で送信）"
                    className="flex-1 min-w-0 resize-none bg-[var(--surface-2)] border-2 border-[var(--line)] focus:border-[var(--accent)] rounded-[4px] px-3 py-2 text-[13px] focus:outline-none max-h-32"
                    style={{ height: "auto" }}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = Math.min(el.scrollHeight, 128) + "px";
                    }}
                  />
                  <PixelButton type="submit" size="sm" disabled={!draft.trim()} loading={streaming} className="shrink-0">
                    {!streaming && <FaPaperPlane />}
                  </PixelButton>
                </div>
              </form>
            )}
          </aside>
        </>
      )}
    </>
  );
}
