"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { FaCheck, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { PixelButton } from "./PixelButton";

/**
 * 操作の結果と、取り返しのつかない操作の確認をまとめて扱う層。
 *
 * これまでは server action を await するだけで、
 * 成功も失敗も画面に出ず、削除は無警告で実行されていた。
 * 「押しても何も起きないように見える」「消すつもりが無かった」の両方が
 * 手を止める原因になるので、アプリ全体で 1 つの作法に統一する。
 */

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
};

type FeedbackContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used within <FeedbackProvider>");
  return ctx;
}

const TOAST_STYLES: Record<ToastKind, { icon: React.ReactNode; className: string }> = {
  success: { icon: <FaCheck />, className: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  error: { icon: <FaExclamationTriangle />, className: "bg-red-50 text-red-800 border-red-300" },
  info: { icon: <FaInfoCircle />, className: "bg-white text-stone-800 border-stone-300" },
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  >(null);
  const nextId = useRef(0);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setConfirmState({ ...options, resolve })),
    []
  );

  const close = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {/* トースト */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 pixel-border-sm font-bold text-sm shadow-lg max-w-[90vw] md:max-w-md",
              TOAST_STYLES[t.kind].className
            )}
            role="status"
          >
            <span className="shrink-0">{TOAST_STYLES[t.kind].icon}</span>
            <span className="break-words">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="ml-2 opacity-50 hover:opacity-100 shrink-0"
              aria-label="閉じる"
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      {/* 確認ダイアログ */}
      {confirmState && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => close(false)} />
          <div className="relative bg-white pixel-border p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-lg">{confirmState.title}</h3>
            {confirmState.message && (
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {confirmState.message}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <PixelButton variant="secondary" onClick={() => close(false)}>
                キャンセル
              </PixelButton>
              <PixelButton
                onClick={() => close(true)}
                className={confirmState.tone === "danger" ? "bg-red-500 hover:bg-red-600" : ""}
                autoFocus
              >
                {confirmState.confirmLabel || "実行する"}
              </PixelButton>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
