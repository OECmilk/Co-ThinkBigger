"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PixelButton } from "@/components/ui/PixelButton";
import { FaTimes, FaPaperPlane, FaQuoteLeft, FaTrash } from "react-icons/fa";
import { cn, timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/project/Authorship";
import { deleteMessage, postMessage } from "@/app/dashboard/projects/[id]/actions";
import { useAction } from "@/components/ui/useAction";
import { Spinner } from "@/components/ui/Spinner";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  mindMapNodeId?: string | null;
  profileId: string;
  profile: { id?: string; username: string; avatarUrl: string | null };
};

type ChatDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  /** 課題候補ごとのスレッド */
  candidateId?: string | null;
  /** ステップごとのスレッド（candidateId と排他） */
  step?: string | null;
  title: string;
  variant?: "drawer" | "inline";
  inputRef?: React.RefObject<HTMLInputElement | null>;
  replyToNode?: { id: string; label: string } | null;
  onClearReply?: () => void;
  onMessageHover?: (nodeId: string | null) => void;
};

/**
 * 議論スレッド。
 *
 * 直したこと:
 *  - チャンネル名が固定で、複数のスレッドを開くと購読が衝突していた
 *  - realtime のフィルタに Supabase が解釈できない "AND" を書いていた
 *  - 送信をブラウザから直接 insert していたため、通知が飛ばなかった
 *  - ステップごとのスレッドが無く、STEP 2 の議論だけが全体チャットを占有していた
 */
export function ChatDrawer({
  isOpen,
  onClose,
  projectId,
  candidateId,
  step,
  title,
  variant = "drawer",
  inputRef,
  replyToNode,
  onClearReply,
  onMessageHover,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const [stepColumnMissing, setStepColumnMissing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { run, isBusy } = useAction();

  const isDrawer = variant === "drawer";
  const active = isOpen || !isDrawer;

  const fetchMessages = useCallback(async () => {
    const supabase = createClient();
    const select = `id, content, createdAt, profileId, mindMapNodeId, profile:Profile(id, username, avatarUrl)`;

    const build = (withStep: boolean) => {
      let q = supabase.from("Message").select(select).order("createdAt", { ascending: true });
      if (candidateId) return q.eq("candidateId", candidateId);
      q = q.eq("projectId", projectId).is("candidateId", null);
      // Message.step は migration_v2 で追加。無い環境ではプロジェクト全体のスレッドとして扱う。
      return withStep && step ? q.eq("step", step) : q;
    };

    let { data, error } = await build(!stepColumnMissing);
    if (error?.code === "42703") {
      setStepColumnMissing(true);
      ({ data } = await build(false));
    }

    if (data) {
      setMessages(
        data.map((m: any) => ({
          ...m,
          id: String(m.id),
          profileId: String(m.profileId),
          profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
        }))
      );
    }
  }, [candidateId, projectId, step, stepColumnMissing]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("Profile").select("id").eq("userId", user.id).single();
      if (data) setCurrentProfileId(String(data.id));
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    fetchMessages();

    const supabase = createClient();
    // スレッドごとに固有のチャンネル名にして、同時に開いても衝突しないようにする
    const threadKey = candidateId ? `candidate-${candidateId}` : `project-${projectId}-${step ?? "all"}`;
    const channel = supabase
      .channel(`chat-${threadKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Message",
          // Supabase のフィルタは 1 条件のみ。残りは取得側の条件で担保する。
          filter: candidateId ? `candidateId=eq.${candidateId}` : `projectId=eq.${projectId}`,
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [active, candidateId, projectId, step, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen && isDrawer) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    setNewMessage("");
    if (onClearReply) onClearReply();

    run(
      async () => {
        const res = await postMessage(projectId, text, {
          candidateId: candidateId ?? null,
          step: candidateId ? null : step ?? null,
          mindMapNodeId: replyToNode?.id ?? null,
        });
        if (res.error) setNewMessage(text); // 失敗したら入力を戻す
        await fetchMessages();
        return res;
      },
      { key: "send", error: "メッセージの送信に失敗しました" }
    );
  };

  const containerClasses = isDrawer
    ? "fixed top-0 right-0 h-full w-full md:w-[420px] bg-white z-[120] shadow-2xl border-l-4 border-stone-800 flex flex-col"
    : "flex flex-col h-full bg-white pixel-border-sm";

  return (
    <>
      {isDrawer && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[110]" onClick={onClose} />
      )}

      <div className={containerClasses} onClick={() => setContextMenu(null)}>
        <div className="p-3 border-b-2 border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
          <div className="min-w-0">
            <h3 className="font-bold text-sm leading-tight line-clamp-1">{title}</h3>
            <p className="text-[10px] text-stone-500">
              {messages.length > 0 ? `${messages.length} 件のコメント` : "ディスカッション"}
            </p>
          </div>
          {isDrawer && (
            <button onClick={onClose} className="p-1 hover:bg-stone-200" aria-label="閉じる">
              <FaTimes />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-grid-pattern">
          {messages.length === 0 ? (
            <div className="text-center text-stone-400 mt-10 text-xs leading-relaxed">
              <p>まだコメントはありません。</p>
              <p>離れていても、考えた理由をひとこと残しておくと後で効きます。</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.profileId === currentProfileId;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 rounded p-1 group relative transition-colors",
                    msg.mindMapNodeId ? "hover:bg-orange-50/50" : "hover:bg-white/60"
                  )}
                  onMouseEnter={() => onMessageHover?.(msg.mindMapNodeId || null)}
                  onMouseLeave={() => onMessageHover?.(null)}
                  onContextMenu={(e) => {
                    if (isMine) {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id });
                    }
                  }}
                >
                  <Avatar author={{ id: msg.profile?.id || "", username: msg.profile?.username || "?", avatarUrl: msg.profile?.avatarUrl ?? null }} size={26} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-bold text-[11px] truncate">
                        {isMine ? "あなた" : msg.profile?.username}
                      </span>
                      <span className="text-[9px] text-stone-400 shrink-0" suppressHydrationWarning>
                        {timeAgo(msg.createdAt)}
                      </span>
                    </div>

                    {msg.mindMapNodeId && (
                      <div className="flex items-center gap-1 text-[9px] text-orange-600 mb-0.5 font-bold">
                        <FaQuoteLeft className="text-[6px]" />
                        <span>関連ノードあり</span>
                      </div>
                    )}

                    <div className="bg-white p-2 pixel-border-sm text-xs break-words whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {contextMenu && (
          <div
            className="fixed bg-white pixel-border-sm shadow-xl z-[200] py-1 min-w-[110px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const id = contextMenu.messageId;
                setContextMenu(null);
                run(
                  async () => {
                    const res = await deleteMessage(id, projectId);
                    await fetchMessages();
                    return res;
                  },
                  {
                    confirm: { title: "コメントを削除しますか？", confirmLabel: "削除する", tone: "danger" },
                    success: "削除しました",
                  }
                );
              }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <FaTrash /> 削除する
            </button>
          </div>
        )}

        {replyToNode && (
          <div className="px-3 py-1.5 bg-orange-50 border-t border-orange-100 flex justify-between items-center text-[10px] text-orange-800 shrink-0">
            <div className="flex items-center gap-2 max-w-[80%]">
              <span className="font-bold bg-orange-200 px-1 rounded shrink-0">@</span>
              <span className="truncate">{replyToNode.label}</span>
              <span className="shrink-0">にコメント中</span>
            </div>
            <button onClick={onClearReply} className="p-1 hover:bg-orange-200 rounded-full" aria-label="解除">
              <FaTimes />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="p-2 border-t-2 border-stone-100 bg-white shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="flex-1 bg-stone-50 pixel-border-sm px-2 py-2 text-xs focus:outline-none focus:bg-orange-50 min-w-0"
              placeholder="メッセージ..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <PixelButton
              type="submit"
              className="px-3 py-1 text-xs shrink-0 flex items-center justify-center"
              disabled={!newMessage.trim() || isBusy("send")}
            >
              {isBusy("send") ? <Spinner size={11} /> : <FaPaperPlane />}
            </PixelButton>
          </div>
        </form>
      </div>
    </>
  );
}
