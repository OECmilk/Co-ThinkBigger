"use client";

import { useState } from "react";
import { addChoice, deleteChoice, setShared } from "../actions";
import { FaPlus, FaTrash, FaGlobe, FaShare, FaUndo, FaComments, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { SearchGuide } from "./SearchGuide";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { AuthorStamp, PersonalTeamTabs, type Author } from "@/components/project/Authorship";
import { StepHeader, StepFooterNav, EmptyState, BlockerNotice } from "@/components/project/StepScaffold";
import { useAction } from "@/components/ui/useAction";
import { Spinner } from "@/components/ui/Spinner";
import { useFeedback } from "@/components/ui/Feedback";
import { AiSuggest } from "@/components/ai/AiSuggest";
import type { ProjectProgress, StepProgress } from "@/lib/project";

type Choice = {
  id: string;
  title: string;
  sourceURL: string | null;
  isOutsideDomain: boolean;
  isShared: boolean;
  createdAt: string;
  author: Author;
  isMine: boolean;
};

type Row = { id: string; title: string; choices: Choice[] };

export default function Step4Client({
  projectId,
  step,
  progress,
  mainProblem,
  aiReady,
  rows,
}: {
  projectId: string;
  step: StepProgress;
  progress: ProjectProgress;
  mainProblem: string;
  aiReady: boolean;
  rows: Row[];
}) {
  const [activeTab, setActiveTab] = useState<"personal" | "team">("personal");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", url: "", outside: false });
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { run, isBusy } = useAction();
  const { toast } = useFeedback();

  const visible = (choices: Choice[]) =>
    activeTab === "personal" ? choices.filter((c) => c.isMine) : choices.filter((c) => c.isShared);

  const personalCount = rows.reduce((n, r) => n + r.choices.filter((c) => c.isMine).length, 0);
  const teamCount = rows.reduce((n, r) => n + r.choices.filter((c) => c.isShared).length, 0);
  const teamOutsideCount = rows.reduce(
    (n, r) => n + r.choices.filter((c) => c.isShared && c.isOutsideDomain).length,
    0
  );

  const submitChoice = (e: React.FormEvent, subProblemId: string) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = { ...form };
    run(
      async () => {
        const res = await addChoice(subProblemId, projectId, payload.title, payload.outside, payload.url);
        if (!res.error) {
          setForm({ title: "", url: "", outside: false });
          setAddingTo(null);
          res.unlocked?.forEach((b) => toast(`${b.icon} 実績「${b.label}」を獲得しました！`, "success"));
        }
        return res;
      },
      { key: "add-choice", success: "先行事例を追加しました" }
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <StepHeader
        step={step}
        description={
          <>
            サブ課題ごとに「すでに世の中にある解き方」を集めます。
            <br />
            <span className="text-purple-700 font-bold">まったく別の分野（領域外）の事例</span>が、
            斬新な組み合わせの材料になります。ここを飛ばすと STEP 5 で手が止まります。
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

      {step.blocker ? (
        <BlockerNotice blocker={step.blocker} steps={progress.steps} />
      ) : (
        <>
          {mainProblem && (
            <div className="bg-white pixel-border-sm p-4 text-sm">
              <span className="text-[11px] font-bold text-stone-400 block mb-1">メイン課題</span>
              <span className="font-bold break-words">{mainProblem}</span>
            </div>
          )}

          {/* 領域外がゼロだと THINK BIGGER にならないので、はっきり警告する */}
          <div
            className={cn(
              "flex items-start gap-3 p-4 text-sm border-l-4",
              teamOutsideCount > 0 ? "bg-emerald-50 border-emerald-500" : "bg-purple-50 border-purple-500"
            )}
          >
            {teamOutsideCount > 0 ? (
              <FaCheckCircle className="text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <FaExclamationTriangle className="text-purple-600 mt-0.5 shrink-0" />
            )}
            <div>
              <div className="font-bold">
                領域外の事例: チーム共有 {teamOutsideCount} 件
              </div>
              <p className="text-stone-700 mt-0.5">
                {teamOutsideCount > 0
                  ? "良い状態です。もう少し遠い分野からも探すと、組み合わせの幅が広がります。"
                  : "同じ業界の中だけで探すと、既存の解決策の焼き直しになります。まったく別の分野の事例を1つは入れましょう（追加時に「領域外」にチェック）。"}
              </p>
            </div>
          </div>

          <SearchGuide />

          <div className="bg-white pixel-border-sm">
            <PersonalTeamTabs
              value={activeTab}
              onChange={setActiveTab}
              personalCount={personalCount}
              teamCount={teamCount}
            />

            <div className="p-4 space-y-4">
              <p className="text-xs text-stone-500">
                {activeTab === "personal"
                  ? "自分で集めた事例です。使えそうなものを共有すると、チームの組み合わせ候補になります。"
                  : "チームで共有された事例です。STEP 5 で組み合わせられるのはここに並んだものだけです。"}
              </p>

              <div className="space-y-6">
                {rows.map((row) => {
                  const choices = visible(row.choices);
                  return (
                    <div key={row.id} className="border-l-4 border-stone-800 pl-4">
                      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                        <h4 className="font-bold break-words">{row.title}</h4>
                        <span
                          className={cn(
                            "text-[11px] font-bold px-2 py-0.5",
                            choices.length === 0 ? "bg-stone-100 text-stone-500" : "bg-orange-100 text-orange-800"
                          )}
                        >
                          {choices.length} 件
                        </span>
                      </div>

                      {activeTab === "personal" && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <AiSuggest
                            projectId={projectId}
                            aiReady={aiReady}
                            compact
                            title={"「" + row.title + "」の領域外事例"}
                            triggerLabel="別分野の事例をAIに探してもらう"
                            buildRequest={() => ({ kind: "choices", subProblemId: row.id, wantOutside: true })}
                            buildAdopt={(selected) => ({
                              kind: "choices",
                              subProblemId: row.id,
                              items: selected.map((s) => ({ text: s.text, isOutsideDomain: true })),
                            })}
                            className="w-full"
                          />
                          <AiSuggest
                            projectId={projectId}
                            aiReady={aiReady}
                            compact
                            title={"「" + row.title + "」の定番事例"}
                            triggerLabel="同じ分野の定番を探す"
                            buildRequest={() => ({ kind: "choices", subProblemId: row.id, wantOutside: false })}
                            buildAdopt={(selected) => ({
                              kind: "choices",
                              subProblemId: row.id,
                              items: selected.map((s) => ({ text: s.text, isOutsideDomain: false })),
                            })}
                            className="w-full"
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 items-start">
                        {choices.map((choice) => (
                          <div
                            key={choice.id}
                            className={cn(
                              "relative group p-3 pixel-border-sm w-[190px] bg-white",
                              choice.isOutsideDomain && "border-l-4 border-purple-500"
                            )}
                          >
                            <p className="font-bold text-xs mb-1 break-words leading-snug">{choice.title}</p>

                            {choice.isOutsideDomain && (
                              <span className="inline-block text-[9px] bg-purple-100 text-purple-700 px-1 font-bold mb-1">
                                領域外
                              </span>
                            )}

                            {choice.sourceURL && (
                              <a
                                href={choice.sourceURL}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mb-1"
                              >
                                <FaGlobe /> 出典を開く
                              </a>
                            )}

                            <AuthorStamp author={choice.author} at={choice.createdAt} isMine={choice.isMine} />

                            {choice.isMine && (
                              <div className="mt-2 flex items-center gap-2">
                                {choice.isShared ? (
                                  <button
                                    onClick={() =>
                                      run(() => setShared("choice", choice.id, projectId, false), {
                                        key: `share-${choice.id}`,
                                        success: "共有を取り消しました",
                                      })
                                    }
                                    className="text-[10px] font-bold text-stone-400 hover:text-stone-700 flex items-center gap-1 disabled:opacity-50"
                                    disabled={isBusy(`share-${choice.id}`)}
                                  >
                                    {isBusy(`share-${choice.id}`) ? <Spinner size={9} /> : <FaUndo />} 取消
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      run(() => setShared("choice", choice.id, projectId, true), {
                                        key: `share-${choice.id}`,
                                        success: "チームに共有しました",
                                      })
                                    }
                                    className="text-[10px] font-bold text-white bg-[#f97316] hover:bg-orange-600 px-2 py-0.5 flex items-center gap-1 pixel-border-sm disabled:bg-stone-400"
                                    disabled={isBusy(`share-${choice.id}`)}
                                  >
                                    {isBusy(`share-${choice.id}`) ? <Spinner size={9} /> : <FaShare />} 共有
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    run(() => deleteChoice(choice.id, projectId), {
                                      key: `del-${choice.id}`,
                                      confirm: {
                                        title: "この先行事例を削除しますか？",
                                        message: `「${choice.title}」`,
                                        confirmLabel: "削除する",
                                        tone: "danger",
                                      },
                                      success: "削除しました",
                                    })
                                  }
                                  className="text-stone-300 hover:text-red-500 ml-auto opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                  title="削除"
                                  disabled={isBusy(`del-${choice.id}`)}
                                >
                                  {isBusy(`del-${choice.id}`) ? <Spinner size={10} /> : <FaTrash size={12} />}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {activeTab === "personal" &&
                          (addingTo === row.id ? (
                            <form
                              onSubmit={(e) => submitChoice(e, row.id)}
                              className="w-[190px] p-3 bg-white pixel-border-sm space-y-2"
                            >
                              <input
                                className="w-full text-xs font-bold border-b border-stone-300 focus:outline-none focus:border-orange-500 py-1"
                                placeholder="事例のタイトル"
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                autoFocus
                              />
                              <input
                                className="w-full text-[11px] text-stone-500 border-b border-stone-300 focus:outline-none py-1"
                                placeholder="出典 URL（任意）"
                                value={form.url}
                                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                              />
                              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={form.outside}
                                  onChange={(e) => setForm((f) => ({ ...f, outside: e.target.checked }))}
                                />
                                <span className={form.outside ? "text-purple-700 font-bold" : "text-stone-500"}>
                                  別分野（領域外）の事例
                                </span>
                              </label>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setAddingTo(null)}
                                  className="text-[11px] text-stone-400 hover:text-stone-700"
                                >
                                  キャンセル
                                </button>
                                <button
                                  type="submit"
                                  disabled={!form.title.trim() || isBusy("add-choice")}
                                  className="text-[11px] bg-[#f97316] text-white px-2 py-1 font-bold disabled:bg-stone-300 inline-flex items-center gap-1.5"
                                >
                                  {isBusy("add-choice") && <Spinner size={9} />}
                                  追加
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() => {
                                setForm({ title: "", url: "", outside: false });
                                setAddingTo(row.id);
                              }}
                              className="min-h-[80px] w-[190px] flex flex-col items-center justify-center border-2 border-dashed border-stone-300 text-stone-400 hover:text-[#f97316] hover:border-[#f97316] hover:bg-orange-50 transition-colors p-2"
                            >
                              <FaPlus />
                              <span className="text-xs font-bold mt-1">事例を追加</span>
                            </button>
                          ))}

                        {choices.length === 0 && activeTab === "team" && (
                          <p className="text-xs text-stone-400 py-6">
                            まだ共有された事例がありません。「自分の下書き」タブから共有してください。
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {rows.length === 0 && (
                  <EmptyState
                    title="選択マップの行がまだありません"
                    hint="選択マップの行は、チームに共有されたサブ課題です。STEP 2 でサブ課題を共有すると、ここに並びます。"
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <StepFooterNav progress={progress} current="step4" />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        projectId={projectId}
        step="step4"
        title="STEP 4 選択マップの議論"
      />
    </div>
  );
}
