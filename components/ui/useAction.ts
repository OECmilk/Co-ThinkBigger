"use client";

import { useCallback, useTransition } from "react";
import { useFeedback } from "./Feedback";

type RunOptions = {
  /** 成功時に出すトースト。省略すると何も出さない（連続操作の邪魔になる場合） */
  success?: string;
  /** 失敗時の文言。省略すると汎用メッセージ */
  error?: string;
  /** 実行前に出す確認ダイアログ */
  confirm?: { title: string; message?: string; confirmLabel?: string; tone?: "danger" | "default" };
  onSuccess?: () => void;
};

/**
 * server action 呼び出しの定型（保留状態・確認・成功／失敗の通知）を 1 か所に集約する。
 *
 * これを通すことで、どのボタンも
 *   押した瞬間に反応する → 結果が必ず言葉で返る → 失敗が沈黙しない
 * という同じ振る舞いになる。
 */
export function useAction() {
  const [isPending, startTransition] = useTransition();
  const { toast, confirm } = useFeedback();

  const run = useCallback(
    <T,>(fn: () => Promise<T>, options: RunOptions = {}) => {
      const execute = async () => {
        try {
          const result: any = await fn();
          // server action が { error } を返す規約に合わせる
          if (result && typeof result === "object" && "error" in result && result.error) {
            toast(String(result.error), "error");
            return;
          }
          if (options.success) toast(options.success, "success");
          options.onSuccess?.();
        } catch (e) {
          console.error(e);
          toast(options.error ?? "処理に失敗しました。もう一度お試しください。", "error");
        }
      };

      if (options.confirm) {
        // 確認は transition の外で待つ（ダイアログ表示中は保留状態にしない）
        confirm(options.confirm).then((ok) => {
          if (ok) startTransition(execute);
        });
        return;
      }

      startTransition(execute);
    },
    [confirm, toast]
  );

  return { run, isPending };
}
