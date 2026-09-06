/**
 * ステップ間を移動したときに即座に表示されるスケルトン。
 * これがあることで、サーバーのデータ取得が終わるまで画面が固まって
 * 見える状態（クリックしても何も起きないように見える状態）が無くなる。
 * サイドバーは layout 側なので保持されたまま、本文だけが差し替わる。
 */
export default function ProjectSectionLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-1/3 bg-stone-200 pixel-border-sm" />
      <div className="h-4 w-1/2 bg-stone-200" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-white border-4 border-stone-200" />
        ))}
      </div>
    </div>
  );
}
