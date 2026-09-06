import { cn } from "@/lib/utils";

/**
 * ボタン内に置く小さな処理中インジケータ。
 *
 * 回転する四角形にしているのは、丸いスピナーだと
 * ドット絵の見た目から浮いてしまうため（LoadingSpinner と同じ考え方）。
 * 色は currentColor を使うので、置いた場所の文字色に自動で馴染む。
 */
export function Spinner({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="処理中"
      className={cn("inline-block bg-current animate-spin shrink-0 align-middle", className)}
      style={{ width: size, height: size }}
    />
  );
}
