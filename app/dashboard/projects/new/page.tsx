"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaUsers, FaRoute } from "react-icons/fa";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { useAction } from "@/components/ui/useAction";
import { createProject } from "./actions";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { run, isPending } = useAction();
  const router = useRouter();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      async () => {
        const res = await createProject(name, description);
        if (res.projectId) router.push(`/dashboard/projects/${res.projectId}/step1`);
        return res;
      },
      { success: "プロジェクトを作成しました" }
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-2">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-stone-500 hover:text-[#f97316] mb-6 font-bold"
      >
        <FaArrowLeft /> ダッシュボードに戻る
      </Link>

      <PixelCard title="新規プロジェクト作成">
        <form onSubmit={handleCreate} className="flex flex-col gap-6 pt-4">
          <PixelInput
            label="プロジェクト名"
            placeholder="例: 次世代コーヒーメーカー"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm text-stone-600">
              メイン課題（後から変えられます）
            </label>
            <textarea
              className="bg-white pixel-border-sm px-4 py-2 focus:outline-none focus:bg-orange-50 min-h-[100px]"
              placeholder="解決したい中核の課題は何ですか？　例: どうすれば一人暮らしの高齢者が毎日温かいものを飲めるだろうか？"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-stone-500">
              決まっていなければ空のままで大丈夫です。STEP 1 でチームと候補を出し合って決められます。
            </p>
          </div>

          {/* これから何が起きるかを先に見せて、初回の不安を減らす */}
          <div className="bg-stone-50 pixel-border-sm p-4 text-xs text-stone-600 space-y-2">
            <p className="font-bold text-stone-700 flex items-center gap-2">
              <FaRoute className="text-[#f97316]" /> 作成後の流れ
            </p>
            <p className="leading-relaxed">
              01 課題候補 → 02 課題分解 → 03 要望分析 → 04 選択マップ → 05 組み合わせ → 06 評価。
              サイドバーが常に「次にやること」を示すので、途中で離れても続きから再開できます。
            </p>
            <p className="font-bold text-stone-700 flex items-center gap-2 pt-1">
              <FaUsers className="text-[#f97316]" /> 仲間を呼ぶ
            </p>
            <p className="leading-relaxed">
              作成後、「メンバー」画面の招待リンクを送るだけで参加できます。アカウントが無い人も登録後に自動で参加します。
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard">
              <PixelButton type="button" variant="secondary">
                キャンセル
              </PixelButton>
            </Link>
            <PixelButton type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "作成中..." : "プロジェクトを開始"}
            </PixelButton>
          </div>
        </form>
      </PixelCard>
    </div>
  );
}
