"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelCard } from "@/components/ui/PixelCard";
import { addCandidate, rateCandidate, setMainProblem, updateCandidate, deleteCandidate } from "../actions";
import {
  FaPaperPlane, FaFire, FaRegCommentDots, FaCrown, FaEdit, FaTrash, FaTimes, FaSave,
  FaNewspaper, FaLightbulb,
} from "react-icons/fa";
import { cn } from "@/lib/utils";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { AuthorStamp, type Author } from "@/components/project/Authorship";
import { StepHeader, StepFooterNav, EmptyState } from "@/components/project/StepScaffold";
import { useAction } from "@/components/ui/useAction";
import { useFeedback } from "@/components/ui/Feedback";
import { Spinner } from "@/components/ui/Spinner";
import { CandidateSeed } from "@/components/ai/CandidateSeed";
import { TopicBoard } from "@/components/ai/TopicBoard";
import { AiSuggest } from "@/components/ai/AiSuggest";
import type { ProjectProgress, StepProgress } from "@/lib/project";

type Candidate = {
  id: string;
  title: string;
  createdAt: string;
  author: Author;
  isMine: boolean;
  messageCount: number;
  reactions: { score: number; profileId: string; username: string }[];
};

export default function Step1Client({
  projectId,
  step,
  progress,
  candidates,
  currentProfileId,
  aiReady,
  mainProblem,
  totalMembers,
}: {
  projectId: string;
  step: StepProgress;
  progress: ProjectProgress;
  candidates: Candidate[];
  currentProfileId: string;
  aiReady: boolean;
  mainProblem: string;
  totalMembers: number;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [activeChat, setActiveChat] = useState<{ id: string; title: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // 「思いつかない」ときの導線。ニュースの見出しを AI への種として渡せる。
  const [seedHint, setSeedHint] = useState("");
  const [seedKey, setSeedKey] = useState(0);
  const [showTopics, setShowTopics] = useState(false);

  /**
   * 関心度は「押した瞬間に色が変わる」ことが大事なので、
   * サーバーの往復を待たずにブラウザ側で先に反映する。
   * 送る値はサーバーが保存する値と同じなので、
   * 保存が成功すれば再取得後もそのまま一致する（失敗時だけ巻き戻す）。
   */
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, number>>({});

  const { run, isBusy } = useAction();
  const { toast } = useFeedback();
  const router = useRouter();

  const celebrate = (res: any) => {
    res?.unlocked?.forEach((b: { icon: string; label: string }) =>
      toast(`${b.icon} 実績「${b.label}」を獲得しました！`, "success")
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const value = newTitle;
    run(
      async () => {
        const res = await addCandidate(projectId, value);
        if (!res.error) {
          setNewTitle("");
          celebrate(res);
        }
        return res;
      },
      { key: "add-candidate", success: "課題候補を追加しました" }
    );
  };

  const handleSetMain = (id: string, title: string) => {
    run(() => setMainProblem(projectId, title), {
      key: `main-${id}`,
      confirm: {
        title: "メイン課題として設定しますか？",
        message: `「${title}」\n\nチーム全員の前提が変わり、STEP 2 以降がこの課題を軸に進みます。メンバーにも通知されます。`,
        confirmLabel: "メイン課題にする",
      },
      success: "メイン課題を設定しました。STEP 2 に進みましょう",
      onSuccess: () => router.push(`/dashboard/projects/${projectId}/step2`),
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="space-y-8">
        <StepHeader
          step={step}
          description={
            <>
              まずは思いつく限りの課題を、質より量で出しましょう。
              <br />
              5 段階の炎でメンバーの関心度を可視化し、いちばん熱いものをメイン課題に決めます。
            </>
          }
        />

        {/* 決定済みのメイン課題を常に見せておく（何のための作業か見失わないように） */}
        {mainProblem && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 flex items-start gap-3">
            <FaCrown className="text-emerald-600 mt-1 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-emerald-700">現在のメイン課題</div>
              <div className="font-bold break-words">{mainProblem}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1">
            <PixelInput
              placeholder="課題を入力（例: どうすれば◯◯できるだろうか？）"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-base"
            />
          </div>
          <PixelButton
            type="submit"
            disabled={isBusy("add-candidate") || !newTitle.trim()}
            className="h-[46px] px-8 flex items-center justify-center"
          >
            {isBusy("add-candidate") ? <Spinner size={14} /> : <FaPaperPlane />}
          </PixelButton>
        </form>

        {/* 手が止まったときの逃げ道を、入力欄のすぐ下に置く */}
        <section className="panel p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-2)]">
            <FaLightbulb className="text-[var(--accent)]" />
            思いつかないときは
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <CandidateSeed
              projectId={projectId}
              aiReady={aiReady}
              hint={seedHint}
              onHintChange={setSeedHint}
              autoOpenKey={seedKey}
            />
            <button
              onClick={() => setShowTopics((v) => !v)}
              className="press inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-[3px] border-2 border-dashed border-[var(--line)] bg-white text-[var(--ink-2)] hover:border-[var(--ink-3)] transition-colors"
            >
              <FaNewspaper />
              {showTopics ? "世の中のいまを閉じる" : "世の中のいまを見る"}
            </button>
            {mainProblem && (
              <AiSuggest
                projectId={projectId}
                aiReady={aiReady}
                single
                title="課題の問い直し"
                triggerLabel="いまの課題を問い直す"
                buildRequest={() => ({ kind: "reframe" })}
                buildAdopt={(selected) => ({ kind: "reframe", text: selected[0].text })}
                className="w-full"
              />
            )}
          </div>

          {showTopics && (
            <TopicBoard
              className="animate-rise"
              onPick={(title) => {
                setSeedHint(title);
                setSeedKey((k) => k + 1);
              }}
            />
          )}
        </section>

        {candidates.length === 0 ? (
          <EmptyState
            title="まだ課題候補がありません"
            hint={
              <>
                THINK BIGGER は「良い問いを選ぶ」ところから始まります。
                <br />
                上の入力欄から、思いついた課題をどんどん書き出してみましょう。
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {candidates.map((candidate) => {
              // 楽観更新を反映したリアクション一覧。
              // 平均点と参加率のリングも、押した直後に一緒に動く。
              const draft = ratingDrafts[candidate.id];
              const serverMine = candidate.reactions.find((r) => r.profileId === currentProfileId);
              const reactions =
                draft === undefined
                  ? candidate.reactions
                  : serverMine
                    ? candidate.reactions.map((r) =>
                        r.profileId === currentProfileId ? { ...r, score: draft } : r
                      )
                    : [
                        ...candidate.reactions,
                        { score: draft, profileId: currentProfileId, username: "あなた" },
                      ];

              const myRating = draft ?? serverMine?.score ?? 0;
              const total = reactions.reduce((sum, r) => sum + r.score, 0);
              const avgScore = reactions.length > 0 ? (total / reactions.length).toFixed(1) : "0.0";
              const participationRate = (reactions.length / totalMembers) * 100;
              const isEditingThis = editingId === candidate.id;

              return (
                <PixelCard
                  key={candidate.id}
                  className="min-h-[210px] flex flex-col justify-between hover:bg-stone-50 transition-colors relative group"
                >
                  <div className="mb-3 pr-14">
                    {isEditingThis ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-sm font-bold border-b-2 border-orange-500 focus:outline-none bg-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            run(
                              async () => {
                                const res = await updateCandidate(candidate.id, projectId, editTitle);
                                if (!res.error) setEditingId(null);
                                return res;
                              },
                              { success: "更新しました" }
                            )
                          }
                          className="text-emerald-600 hover:text-emerald-800"
                          aria-label="保存"
                        >
                          <FaSave />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-stone-400 hover:text-stone-600"
                          aria-label="キャンセル"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-sm font-bold leading-relaxed break-words">{candidate.title}</h3>
                    )}
                    <AuthorStamp
                      author={candidate.author}
                      at={candidate.createdAt}
                      isMine={candidate.isMine}
                      className="mt-2"
                    />
                  </div>

                  {candidate.isMine && !isEditingThis && (
                    <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingId(candidate.id);
                          setEditTitle(candidate.title);
                        }}
                        className="text-stone-300 hover:text-stone-600"
                        title="編集"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() =>
                          run(() => deleteCandidate(candidate.id, projectId), {
                            confirm: {
                              title: "この課題候補を削除しますか？",
                              message: `「${candidate.title}」\n\nこの候補に付いた評価とコメントも一緒に消えます。`,
                              confirmLabel: "削除する",
                              tone: "danger",
                            },
                            success: "削除しました",
                          })
                        }
                        className="text-stone-300 hover:text-red-500"
                        title="削除"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}

                  {/* 平均スコアと、何人が評価済みかを外周のリングで示す */}
                  <div
                    className="absolute top-4 right-4 flex items-center justify-center w-12 h-12 rounded-full"
                    style={{
                      background: `conic-gradient(#f97316 0% ${participationRate}%, #e7e5e4 ${participationRate}% 100%)`,
                    }}
                    title={
                      reactions.length > 0
                        ? reactions.map((r) => `${r.username}: ${r.score}点`).join("\n")
                        : "まだ誰も評価していません"
                    }
                  >
                    <div className="w-[42px] h-[42px] bg-white rounded-full flex flex-col items-center justify-center">
                      <FaFire className={cn("text-xs", Number(avgScore) >= 3 ? "text-red-500" : "text-stone-400")} />
                      <span className="text-xs font-bold font-mono">{avgScore}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="pt-2 border-t-2 border-dashed border-stone-200">
                      <div className="text-[10px] font-bold text-stone-400 mb-1.5">
                        あなたの関心度（{reactions.length} / {totalMembers} 人が評価済み）
                      </div>
                      <div className="flex items-center justify-between">
                        <FaFire className="text-stone-300" />
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              onClick={() => {
                                const previous = ratingDrafts[candidate.id];
                                setRatingDrafts((d) => ({ ...d, [candidate.id]: score }));
                                run(() => rateCandidate(candidate.id, projectId, score), {
                                  key: `rate-${candidate.id}`,
                                  error: "評価の保存に失敗しました",
                                  onError: () =>
                                    setRatingDrafts((d) => {
                                      const next = { ...d };
                                      if (previous === undefined) delete next[candidate.id];
                                      else next[candidate.id] = previous;
                                      return next;
                                    }),
                                });
                              }}
                              className={cn(
                                "w-8 h-8 pixel-border-sm font-bold text-sm transition-all hover:scale-110 active:scale-95",
                                myRating === score ? "bg-orange-500 text-white" : "bg-white hover:bg-orange-100"
                              )}
                              aria-label={`${score}点をつける`}
                              aria-pressed={myRating === score}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                        <FaFire className="text-red-500" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <button
                        onClick={() => setActiveChat({ id: candidate.id, title: candidate.title })}
                        className="flex items-center gap-1.5 text-stone-500 text-xs font-bold hover:text-[#f97316] transition-colors"
                      >
                        <FaRegCommentDots className="text-base" />
                        {candidate.messageCount > 0 ? `${candidate.messageCount} 件の議論` : "議論する"}
                      </button>

                      <PixelButton
                        onClick={() => handleSetMain(candidate.id, candidate.title)}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1 text-xs"
                        disabled={isBusy(`main-${candidate.id}`)}
                      >
                        {isBusy(`main-${candidate.id}`) ? (
                          <Spinner size={11} />
                        ) : (
                          <FaCrown className="text-yellow-500" />
                        )}
                        メイン課題へ
                      </PixelButton>
                    </div>
                  </div>
                </PixelCard>
              );
            })}
          </div>
        )}

        <StepFooterNav progress={progress} current="step1" />
      </div>

      <ChatDrawer
        isOpen={!!activeChat}
        onClose={() => setActiveChat(null)}
        projectId={projectId}
        candidateId={activeChat?.id}
        title={activeChat?.title || ""}
      />
    </div>
  );
}
