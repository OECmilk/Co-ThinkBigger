"use client";

import { useState } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { addSubProblem, deleteSubProblem, updateProjectDescription, setShared } from "../actions";
import { FaPlus, FaTrash, FaComments, FaSave, FaEdit, FaSitemap, FaShare, FaUndo } from "react-icons/fa";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { AuthorStamp, PersonalTeamTabs, ShareBadge, type Author } from "@/components/project/Authorship";
import { StepHeader, StepFooterNav, EmptyState, BlockerNotice } from "@/components/project/StepScaffold";
import { useAction } from "@/components/ui/useAction";
import { Spinner } from "@/components/ui/Spinner";
import { useFeedback } from "@/components/ui/Feedback";
import { AiSuggest } from "@/components/ai/AiSuggest";
import type { ProjectProgress, StepProgress } from "@/lib/project";

type SubProblem = {
  id: string;
  title: string;
  isShared: boolean;
  createdAt: string;
  author: Author;
  isMine: boolean;
};

export default function Step2Client({
  projectId,
  step,
  progress,
  mainProblem,
  aiReady,
  subProblems,
}: {
  projectId: string;
  step: StepProgress;
  progress: ProjectProgress;
  mainProblem: string;
  aiReady: boolean;
  subProblems: SubProblem[];
}) {
  const [description, setDescription] = useState(mainProblem || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newSubProblem, setNewSubProblem] = useState("");
  const [activeTab, setActiveTab] = useState<"personal" | "team">("personal");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { run, isBusy } = useAction();
  const { toast } = useFeedback();

  const mine = subProblems.filter((s) => s.isMine);
  const shared = subProblems.filter((s) => s.isShared);
  const list = activeTab === "personal" ? mine : shared;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubProblem.trim()) return;
    const value = newSubProblem;
    run(
      async () => {
        const res = await addSubProblem(projectId, value);
        if (!res.error) {
          setNewSubProblem("");
          res.unlocked?.forEach((b) => toast(`${b.icon} 実績「${b.label}」を獲得しました！`, "success"));
        }
        return res;
      },
      { key: "add-sub", success: "サブ課題を追加しました。まとまったらチームに共有しましょう" }
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <StepHeader
        step={step}
        description={
          <>
            メイン課題を、独立して解ける 3〜5 個のサブ課題に割ります。
            <br />
            まず<span className="font-bold">「自分の下書き」で一人で考え</span>、納得したものだけを
            <span className="font-bold">チームに共有</span>してください。最初から合議にしないのが THINK BIGGER のコツです。
          </>
        }
        actions={
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white pixel-border-sm text-stone-600 hover:text-[#f97316] font-bold text-sm transition-colors shrink-0"
          >
            <FaComments /> このステップの議論
          </button>
        }
      />

      {step.blocker && <BlockerNotice blocker={step.blocker} steps={progress.steps} />}

      {/* 何を分解しているのか、常に見えるようにしておく */}
      <div className="bg-white pixel-border-sm p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold flex items-center gap-2">
            <FaSitemap className="text-[#f97316]" /> メイン課題
          </h3>
          {!isEditingDesc && (
            <button
              onClick={() => {
                setDescription(mainProblem || "");
                setIsEditingDesc(true);
              }}
              className="text-stone-400 hover:text-stone-800"
              title="編集"
            >
              <FaEdit />
            </button>
          )}
        </div>

        {isEditingDesc ? (
          <div className="space-y-3">
            <textarea
              className="w-full p-3 pixel-border-sm focus:outline-none focus:bg-orange-50 min-h-[90px]"
              placeholder="例: 高齢者がストレスなく使えるスマートフォンを作る"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <PixelButton variant="secondary" onClick={() => setIsEditingDesc(false)}>
                キャンセル
              </PixelButton>
              <PixelButton
                disabled={!description.trim() || isBusy("main-problem")}
                onClick={() =>
                  run(
                    async () => {
                      const res = await updateProjectDescription(projectId, description);
                      if (!res.error) setIsEditingDesc(false);
                      return res;
                    },
                    {
                      key: "main-problem",
                      confirm: {
                        title: "メイン課題を書き換えますか？",
                        message: "チーム全員の作業の前提になります。変更はメンバーに通知されます。",
                        confirmLabel: "更新する",
                      },
                      success: "メイン課題を更新しました",
                    }
                  )
                }
              >
                {isBusy("main-problem") ? <Spinner size={12} /> : <FaSave />} 保存
              </PixelButton>
            </div>
          </div>
        ) : mainProblem ? (
          <p className="text-lg font-bold py-4 px-4 bg-stone-50 pixel-border-sm break-words">{mainProblem}</p>
        ) : (
          <p className="text-sm text-stone-500 py-4">
            まだ決まっていません。STEP 1 で候補を選ぶか、右上の編集から直接入力できます。
          </p>
        )}
      </div>

      {/* 分解に詰まったとき用。AI の案は必ず「自分の下書き」として入る */}
      {mainProblem && (
        <div className="flex flex-wrap gap-2">
          <AiSuggest
            projectId={projectId}
            aiReady={aiReady}
            title="サブ課題の提案"
            triggerLabel="AIに分解してもらう"
            buildRequest={() => ({ kind: "subProblems" })}
            buildAdopt={(selected) => ({ kind: "subProblems", texts: selected.map((s) => s.text) })}
            className="flex-1 min-w-[260px]"
          />
          <AiSuggest
            projectId={projectId}
            aiReady={aiReady}
            single
            title="課題の問い直し"
            triggerLabel="そもそも課題を問い直す"
            buildRequest={() => ({ kind: "reframe" })}
            buildAdopt={(selected) => ({ kind: "reframe", text: selected[0].text })}
            className="flex-1 min-w-[260px]"
          />
        </div>
      )}

      <div className="bg-white pixel-border-sm">
        <PersonalTeamTabs
          value={activeTab}
          onChange={setActiveTab}
          personalCount={mine.length}
          teamCount={shared.length}
        />

        <div className="p-5 space-y-4">
          <p className="text-xs text-stone-500">
            {activeTab === "personal"
              ? "ここに書いたものは、共有するまで他のメンバーには見えません。"
              : `チームで合意したサブ課題です。STEP 4 の選択マップは、ここに並んだものが行になります。（あと ${Math.max(0, 3 - shared.length)} 件で完了条件）`}
          </p>

          <div className="space-y-3">
            {list.map((sub) => (
              <div key={sub.id} className="bg-stone-50 p-4 pixel-border-sm group">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold break-words">{sub.title}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <AuthorStamp author={sub.author} at={sub.createdAt} isMine={sub.isMine} />
                      <ShareBadge isShared={sub.isShared} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sub.isMine &&
                      (sub.isShared ? (
                        <button
                          onClick={() =>
                            run(() => setShared("subProblem", sub.id, projectId, false), {
                              key: `share-${sub.id}`,
                              confirm: {
                                title: "共有を取り消しますか？",
                                message:
                                  "チームの一覧から外れ、STEP 4 の選択マップからもこの行が消えます。付いている先行事例は残ります。",
                                confirmLabel: "共有を取り消す",
                              },
                              success: "共有を取り消しました",
                            })
                          }
                          className="text-stone-400 hover:text-stone-700 text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                          title="共有を取り消す"
                          disabled={isBusy(`share-${sub.id}`)}
                        >
                          {isBusy(`share-${sub.id}`) ? <Spinner size={10} /> : <FaUndo />} 取消
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            run(() => setShared("subProblem", sub.id, projectId, true), {
                              key: `share-${sub.id}`,
                              success: "チームに共有しました",
                            })
                          }
                          className="text-white bg-[#f97316] hover:bg-orange-600 px-3 py-1.5 text-xs font-bold flex items-center gap-1 pixel-border-sm transition-colors disabled:bg-stone-400"
                          disabled={isBusy(`share-${sub.id}`)}
                        >
                          {isBusy(`share-${sub.id}`) ? <Spinner size={10} /> : <FaShare />}
                          {isBusy(`share-${sub.id}`) ? "共有中…" : "共有する"}
                        </button>
                      ))}

                    {sub.isMine && (
                      <button
                        onClick={() =>
                          run(() => deleteSubProblem(sub.id, projectId), {
                            key: `del-${sub.id}`,
                            confirm: {
                              title: "このサブ課題を削除しますか？",
                              message: `「${sub.title}」\n\nこのサブ課題に集めた先行事例もすべて削除され、これを使った解決策の構成が崩れます。`,
                              confirmLabel: "削除する",
                              tone: "danger",
                            },
                            success: "削除しました",
                          })
                        }
                        className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        title="削除"
                        disabled={isBusy(`del-${sub.id}`)}
                      >
                        {isBusy(`del-${sub.id}`) ? <Spinner size={11} /> : <FaTrash />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {list.length === 0 && (
              <EmptyState
                title={activeTab === "personal" ? "まだ下書きがありません" : "まだ共有されたサブ課題がありません"}
                hint={
                  activeTab === "personal" ? (
                    <>
                      「このメイン課題を解くには、何と何が解ければいいか？」を分けて書き出してみましょう。
                      <br />
                      3〜5 個が目安です。
                    </>
                  ) : (
                    <>
                      「自分の下書き」タブで書いたものを共有すると、ここに並びます。
                      <br />
                      共有されたサブ課題だけが STEP 4 以降で使われます。
                    </>
                  )
                }
                action={
                  activeTab === "team" ? (
                    <PixelButton variant="secondary" onClick={() => setActiveTab("personal")}>
                      自分の下書きを開く
                    </PixelButton>
                  ) : undefined
                }
              />
            )}

            {activeTab === "personal" && (
              <form
                onSubmit={handleAdd}
                className="bg-white border-2 border-dashed border-stone-300 p-4 flex gap-2 items-center"
              >
                <FaPlus className="text-stone-400 shrink-0" />
                <input
                  className="flex-1 bg-transparent focus:outline-none min-w-0"
                  placeholder="新しいサブ課題を追加"
                  value={newSubProblem}
                  onChange={(e) => setNewSubProblem(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newSubProblem.trim() || isBusy("add-sub")}
                  className="text-[#f97316] font-bold hover:underline text-sm disabled:text-stone-300 shrink-0 flex items-center gap-1.5"
                >
                  {isBusy("add-sub") && <Spinner size={10} />}
                  追加
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <StepFooterNav progress={progress} current="step2" />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        projectId={projectId}
        step="step2"
        title="STEP 2 課題分解の議論"
      />
    </div>
  );
}
