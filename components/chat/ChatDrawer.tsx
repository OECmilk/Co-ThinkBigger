"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { FaTimes, FaPaperPlane, FaQuoteLeft, FaTrash } from "react-icons/fa";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  mindMapNodeId?: string | null;
  profile: {
    username: string;
    avatarUrl: string | null;
  };
  profileId: string;
};

type ChatDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  candidateId?: string | null; // If null, project chat
  title: string;
  variant?: 'drawer' | 'inline';
  inputRef?: React.RefObject<HTMLInputElement | null>;
  replyToNode?: { id: string; label: string } | null;
  onClearReply?: () => void;
  onMessageHover?: (nodeId: string | null) => void;
};

export function ChatDrawer({
  isOpen,
  onClose,
  projectId,
  candidateId,
  title,
  variant = 'drawer',
  inputRef,
  replyToNode,
  onClearReply,
  onMessageHover
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<{ username: string, avatarUrl: string | null } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, messageId: string } | null>(null);

  useEffect(() => {
    // Fetch current user profile
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('Profile').select('id, username, avatarUrl').eq('userId', user.id).single();
        if (profile) {
          setCurrentProfileId(profile.id);
          setCurrentProfile({ username: profile.username, avatarUrl: profile.avatarUrl });
        }
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    // Only fetch if open or inline
    if ((isOpen || variant === 'inline') && (projectId || candidateId)) {
      fetchMessages();

      const channel = supabase
        .channel('realtime-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Message',
            filter: candidateId
              ? `candidateId=eq.${candidateId}`
              : `projectId=eq.${projectId} AND candidateId=is.null`,
          },
          (payload) => {
            // We can optimistically handle but fetching is safer for duplicates if we already did optimistic
            // Let's just fetch for now, but ensure we do optimistic insert in handleSend
            fetchMessages();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'Message',
          },
          () => { fetchMessages(); }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isOpen, projectId, candidateId, variant]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isDrawer = variant === 'drawer';

  // Return logic
  if (!isOpen && isDrawer) return null;

  const containerClasses = isDrawer
    ? cn(
      "fixed top-0 right-0 h-full w-full md:w-[400px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-in-out border-l-4 border-stone-800 flex flex-col",
      isOpen ? "translate-x-0" : "translate-x-full"
    )
    : "flex flex-col h-full bg-white pixel-border-sm";

  // Helper functions inside component
  async function fetchMessages() {
    let query = supabase
      .from("Message")
      .select(`
        id,
        content,
        createdAt,
        profileId,
        mindMapNodeId,
        profile:Profile(username, avatarUrl)
      `)
      .order("createdAt", { ascending: true });

    if (candidateId) {
      query = query.eq("candidateId", candidateId);
    } else {
      query = query.eq("projectId", projectId).is("candidateId", null);
    }

    const { data } = await query;
    if (data) {
      setMessages(data as any);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !currentProfileId || !currentProfile) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      content: newMessage,
      createdAt: new Date().toISOString(),
      mindMapNodeId: replyToNode?.id || null,
      profileId: currentProfileId,
      profile: currentProfile
    };

    setMessages(prev => [...prev, optimisticMsg]);
    const messageToSend = newMessage;
    setNewMessage("");
    if (onClearReply) onClearReply();

    const payload = {
      content: messageToSend,
      projectId,
      candidateId: candidateId || null,
      profileId: currentProfileId,
      mindMapNodeId: replyToNode?.id || null
    };

    const { error } = await supabase.from("Message").insert(payload);

    if (error) {
      console.error(error);
      // Remove optimistic message if error?
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert("送信に失敗しました");
    } else {
      // Success. Realtime will trigger fetch, or we can fetch explicitly.
      fetchMessages();
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("コメントを削除しますか？")) return;

    // Optimistic delete
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setContextMenu(null);

    const { error } = await supabase.from("Message").delete().eq("id", messageId);
    if (error) {
      // Revert? (Complex, fetching is easier)
      fetchMessages();
      alert("削除に失敗しました");
    } else {
      fetchMessages();
    }
  };

  return (
    <>
      {/* Backdrop only for drawer */}
      {isDrawer && (
        <div
          className={cn(
            "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
        />
      )}

      {/* Container */}
      <div className={containerClasses} onClick={() => setContextMenu(null)}>
        {/* Header */}
        <div className="p-3 border-b-2 border-stone-100 flex justify-between items-center bg-stone-50">
          <div>
            <h3 className="font-bold text-sm leading-tight line-clamp-1">{title}</h3>
            {isDrawer && <p className="text-[10px] text-stone-500">ディスカッション</p>}
          </div>
          {isDrawer && (
            <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded">
              <FaTimes />
            </button>
          )}
        </div>


        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-grid-pattern relative">
          {messages.length === 0 ? (
            <div className="text-center text-stone-400 mt-10 text-xs">
              <p>まだメッセージはありません。</p>
              <p>議論を開始しましょう！</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.profileId === currentProfileId;
              const isTemp = String(msg.id).startsWith('temp-');

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 transition-colors rounded p-1 group relative",
                    msg.mindMapNodeId ? "hover:bg-orange-50/50 cursor-pointer" : "hover:bg-stone-50/50",
                    isTemp ? "opacity-70" : ""
                  )}
                  onMouseEnter={() => {
                    if (onMessageHover && msg.mindMapNodeId) onMessageHover(msg.mindMapNodeId);
                  }}
                  onMouseLeave={() => {
                    if (onMessageHover) onMessageHover(null);
                  }}
                  onContextMenu={(e) => {
                    if (isMine && !isTemp) {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id });
                    }
                  }}
                >
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex-shrink-0 pixel-border-sm flex items-center justify-center text-[10px] font-bold overflow-hidden mt-0.5">
                    {msg.profile.avatarUrl ? <img src={msg.profile.avatarUrl} /> : msg.profile.username[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-bold text-[10px] truncate">{msg.profile.username}</span>
                      <span className="text-[8px] text-stone-400 flex-shrink-0">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Related Node Context Indicator */}
                    {msg.mindMapNodeId && (
                      <div className="flex items-center gap-1 text-[9px] text-orange-600 mb-0.5 font-bold leading-none">
                        <FaQuoteLeft className="text-[6px]" />
                        <span>関連ノードあり</span>
                      </div>
                    )}

                    <div className="bg-white p-2 pixel-border-sm text-xs break-words whitespace-pre-wrap leading-relaxed shadow-sm">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Context Menu for Message */}
        {contextMenu && (
          <div
            className="fixed bg-white pixel-border-sm shadow-xl z-[100] py-1 min-w-[100px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleDeleteMessage(contextMenu.messageId)}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <FaTrash />
              削除する
            </button>
          </div>
        )}

        {/* Reply Context Widget */}
        {replyToNode && (
          <div className="px-3 py-1.5 bg-orange-50 border-t border-orange-100 flex justify-between items-center text-[10px] text-orange-800">
            <div className="flex items-center gap-2 max-w-[80%]">
              <span className="font-bold bg-orange-200 px-1 rounded flex-shrink-0">@</span>
              <span className="truncate">{replyToNode.label}</span>
              <span>にコメント中</span>
            </div>
            <button
              onClick={onClearReply}
              className="p-1 hover:bg-orange-200 rounded-full"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="p-2 border-t-2 border-stone-100 bg-white">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="flex-1 bg-stone-50 pixel-border-sm px-2 py-1.5 text-xs focus:outline-none focus:bg-orange-50"
              placeholder="メッセージ..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <PixelButton type="submit" className="px-3 py-1 text-xs">
              <FaPaperPlane />
            </PixelButton>
          </div>
        </form>
      </div>
    </>
  );
}
