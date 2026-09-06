import Link from "next/link";
import { redirect } from "next/navigation";
import { FaUserPlus, FaSignInAlt, FaUsers } from "react-icons/fa";
import { createClient } from "@/lib/supabase/server";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { joinProjectByCode } from "../actions";

/**
 * 招待リンクの着地点。
 *
 * 以前はクライアント側で参加処理を投げ、未ログイン時の挙動が
 * server action の redirect 例外に依存していて不安定だった。
 * ここでサーバー側で状態を判定し、
 *   未ログイン → ログイン/新規登録（戻り先つき）
 *   ログイン済 → プロジェクト名を見せてから参加
 * の 2 画面に分ける。
 */
export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  const [{ data: { user } }, { data: project }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("Project").select("id, name, description").eq("inviteCode", code).single(),
  ]);

  const nextPath = `/invite/${code}`;

  return (
    <main className="min-h-screen flex items-center justify-center bg-grid-pattern p-4">
      <PixelCard className="max-w-md w-full text-center space-y-6 p-8">
        <div>
          <p className="text-xs font-bold tracking-widest text-stone-400">CO-THINK BIGGER</p>
          <h1 className="text-2xl font-bold text-stone-800 mt-1">プロジェクトへの招待</h1>
        </div>

        {project ? (
          <div className="bg-stone-50 p-4 pixel-border-sm text-left">
            <div className="text-[11px] font-bold text-stone-400 mb-1">参加するプロジェクト</div>
            <div className="font-bold text-lg break-words">{project.name}</div>
            {project.description && (
              <p className="text-sm text-stone-600 mt-1 break-words">{project.description}</p>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-bold">
            この招待コード（{code}）のプロジェクトが見つかりませんでした。
            <br />
            リンクが古いか、間違っている可能性があります。
          </div>
        )}

        {!project ? (
          <Link href="/dashboard">
            <PixelButton variant="secondary" className="w-full">
              ダッシュボードへ
            </PixelButton>
          </Link>
        ) : user ? (
          <form
            action={async () => {
              "use server";
              const res = await joinProjectByCode(code);
              if (res.projectId) redirect(`/dashboard/projects/${res.projectId}`);
              redirect("/dashboard");
            }}
            className="space-y-3"
          >
            <PixelButton type="submit" className="w-full flex justify-center items-center gap-2">
              <FaUserPlus /> このプロジェクトに参加する
            </PixelButton>
            <p className="text-xs text-stone-500">
              参加すると、6 ステップの進捗をチームで共有しながら進められます。
            </p>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-stone-600 flex items-center justify-center gap-2">
              <FaUsers className="text-[#f97316]" />
              参加するにはログインが必要です
            </p>
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="block">
              <PixelButton className="w-full flex justify-center items-center gap-2">
                <FaSignInAlt /> ログインして参加
              </PixelButton>
            </Link>
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="block">
              <PixelButton variant="secondary" className="w-full flex justify-center items-center gap-2">
                <FaUserPlus /> アカウントを作って参加
              </PixelButton>
            </Link>
            <p className="text-xs text-stone-500">
              登録・ログインが終わると、この招待画面に自動で戻ります。
            </p>
          </div>
        )}
      </PixelCard>
    </main>
  );
}
