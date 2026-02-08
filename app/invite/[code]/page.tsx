"use client";

import { useEffect, useState } from "react";
import { joinProjectByCode } from "../actions";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { useRouter } from "next/navigation";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const [status, setStatus] = useState<'idle' | 'joining' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    params.then(p => setInviteCode(p.code));
  }, [params]);

  const handleJoin = async () => {
    setStatus('joining');
    try {
      const res = await joinProjectByCode(inviteCode);
      if (res.error) {
        setErrorMsg(res.error);
        setStatus('error');
      } else if (res.success && res.projectId) {
        router.push(`/dashboard/projects/${res.projectId}`);
      }
    } catch (e: any) {
      // Typically if unauthorized (handled in server action redirect but sometimes throws)
      // Actually server action redirect throws proper NEXT_REDIRECT error which client handles?
      // No, server action redirects are tricky. Better to handle auth check in client or let server action throw.
      // In joinProjectByCode, we use redirect(). This might be caught here if not careful.
      // But redirect() in server action should work.
      console.error(e);
      // If it's a redirect error, it shouldn't be caught here ideally, or rethrown.
      // Assuming user is logged in for "Join" button to appear? 
      // Actually we show "Login to Join" if not logged in.
      // But we can't easily check session in client without a provider or specific check.
      // Let's rely on the action to redirect if not logged in.
      if (e.message !== "NEXT_REDIRECT") {
        setErrorMsg("エラーが発生しました。");
        setStatus('error');
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-grid-pattern p-4">
      <PixelCard className="max-w-md w-full text-center space-y-6 p-8">
        <h1 className="text-2xl font-bold text-stone-800">プロジェクトへの招待</h1>
        <p className="text-stone-600">
          以下の招待コードを受け取りました。<br />
          プロジェクトに参加してアイデアを出し合いましょう！
        </p>

        <div className="bg-stone-100 p-4 font-mono text-xl tracking-widest font-bold pixel-border-sm">
          {inviteCode}
        </div>

        {status === 'error' && (
          <div className="text-red-500 font-bold text-sm bg-red-50 p-2 rounded">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          <PixelButton onClick={handleJoin} disabled={status === 'joining'} className="w-full flex justify-center items-center gap-2">
            {status === 'joining' ? "参加処理中..." : <><FaUserPlus /> 今すぐ参加する</>}
          </PixelButton>

          <p className="text-xs text-stone-500">
            ※未ログインの場合はログイン画面へ移動します。<br />
            アカウントをお持ちでない場合は、遷移先で「新規登録」を行ってください。<br />
            登録完了後、自動的に参加します。
          </p>
        </div>
      </PixelCard>
    </main>
  );
}
