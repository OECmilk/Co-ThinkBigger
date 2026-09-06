import Link from "next/link";
import { FaLightbulb, FaSitemap, FaProjectDiagram, FaTh, FaObjectGroup, FaBell, FaRoute, FaUsers } from "react-icons/fa";
import { TbChartRadar } from "react-icons/tb";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";

const STEPS = [
  { num: "01", label: "課題候補", icon: FaLightbulb, text: "課題を出し合い、取り組む1つを決める" },
  { num: "02", label: "課題分解", icon: FaSitemap, text: "メイン課題をサブ課題に割る" },
  { num: "03", label: "要望分析", icon: FaProjectDiagram, text: "自分・ターゲット・第三者の望みを出す" },
  { num: "04", label: "選択マップ", icon: FaTh, text: "領域の内と外から先行事例を集める" },
  { num: "05", label: "組み合わせ", icon: FaObjectGroup, text: "事例をつなげて解決策を作る" },
  { num: "06", label: "評価", icon: TbChartRadar, text: "3つの視点で採点し、本命を決める" },
];

const PILLARS = [
  {
    icon: FaRoute,
    title: "途中で迷子にならない",
    text: "各ステップに完了条件があり、サイドバーが常に「次にやること」を示します。数日空けても続きから再開できます。",
  },
  {
    icon: FaUsers,
    title: "まず一人で、それから持ち寄る",
    text: "個人の下書きとチームの共有を分離。最初から合議にせず、各自が考え抜いてから出せます。",
  },
  {
    icon: FaBell,
    title: "非同期でも置いていかれない",
    text: "誰が何をしたかが履歴として残り、通知とリアルタイム反映で、離れた時間帯のメンバーとも噛み合います。",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-grid-pattern">
      <header className="w-full max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 p-6">
        <h1 className="text-xl md:text-2xl font-bold tracking-widest text-[#f97316]">
          <span className="text-stone-800">CO-</span>THINK BIGGER
        </h1>
        <div className="flex gap-3">
          <Link href="/login">
            <PixelButton variant="secondary">ログイン</PixelButton>
          </Link>
          <Link href="/signup">
            <PixelButton>新規登録</PixelButton>
          </Link>
        </div>
      </header>

      <section className="text-center space-y-6 max-w-3xl mx-auto px-6 pt-12 pb-16">
        <h2 className="text-4xl md:text-6xl font-bold leading-tight">
          最後まで<span className="text-[#f97316]">やり切れる</span>
          <br />
          THINK BIGGER
        </h2>
        <p className="text-stone-600 text-base md:text-xl leading-relaxed">
          シーナ・アイエンガーの 6 ステップを、離れたチームで完走するためのツール。
          <br />
          「今どこにいるか」と「次に何をするか」を、いつ開いても見失いません。
        </p>
        <div className="pt-4">
          <Link href="/signup">
            <PixelButton className="text-lg px-10 py-4">無料で始める</PixelButton>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {PILLARS.map((p) => (
          <PixelCard key={p.title} className="h-full">
            <div className="flex flex-col gap-3">
              <p.icon className="text-3xl text-[#f97316]" />
              <h3 className="text-lg font-bold">{p.title}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{p.text}</p>
            </div>
          </PixelCard>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h3 className="text-xl font-bold mb-6 text-center">アプリがガイドする 6 ステップ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <div key={s.num} className="bg-white pixel-border-sm p-4 flex items-start gap-3">
              <span className="text-[#f97316] font-bold text-lg shrink-0">{s.num}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-bold">
                  <s.icon className="text-stone-400" />
                  {s.label}
                </div>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="pb-12 text-center text-stone-400 text-sm">
        © 2026 Co-Think Bigger
      </footer>
    </main>
  );
}
