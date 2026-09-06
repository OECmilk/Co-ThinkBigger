"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaBell, FaTimes } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import { cn, timeAgo } from "@/lib/utils";
import { fetchMyNotifications, markNotificationsRead, type NotificationItem } from "@/app/dashboard/actions";

/**
 * 「自分がいない間にチームで何が起きたか」の入口。
 *
 * 以前の通知ドロワーは存在しない API を叩いており、
 * しかもそれを表示するサイドバー自体がどこからも読み込まれていなかった。
 * ここで作り直し、ヘッダーの常設位置に置く。
 */
export function NotificationBell({ profileId }: { profileId: string }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setItems(await fetchMyNotifications());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${profileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Notification", filter: `profileId=eq.${profileId}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, load]);

  // パネルの外側クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const unread = items.filter((n) => !n.read);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread.length > 0) {
      // 開いた時点で既読にする（バッジが残り続けるのを防ぐ）
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      await markNotificationsRead(unread.map((n) => n.id));
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 hover:bg-stone-100 transition-colors pixel-border-sm bg-white"
        title="通知"
        aria-label={`通知${unread.length > 0 ? `（未読 ${unread.length} 件）` : ""}`}
      >
        <FaBell className={cn(unread.length > 0 ? "text-[#f97316]" : "text-stone-500")} />
        {unread.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#f97316] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white pixel-border z-[150] max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-stone-100 bg-stone-50">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FaBell className="text-[#f97316]" /> 通知
            </h3>
            <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-700" aria-label="閉じる">
              <FaTimes />
            </button>
          </div>

          <div className="overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-8 text-center text-sm text-stone-400">
                まだ通知はありません。
                <br />
                メンバーの動きがあるとここに届きます。
              </p>
            ) : (
              items.map((n) => {
                const body = (
                  <>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-sm truncate">{n.title}</span>
                      <span className="text-[10px] text-stone-400 shrink-0" suppressHydrationWarning>
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">{n.content}</p>
                  </>
                );

                const className = cn(
                  "block w-full text-left px-4 py-3 border-b border-stone-100 transition-colors",
                  n.read ? "hover:bg-stone-50" : "bg-orange-50/60 hover:bg-orange-50"
                );

                return n.link ? (
                  <Link key={n.id} href={n.link} className={className} onClick={() => setOpen(false)}>
                    {body}
                  </Link>
                ) : (
                  <div key={n.id} className={className}>
                    {body}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
