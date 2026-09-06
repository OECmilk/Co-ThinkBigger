"use client";

import { PixelCard } from "@/components/ui/PixelCard";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import Link from "next/link";
import { FaGithub, FaGoogle, FaTwitter } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login failed: " + error.message);
    } else {
      router.push(next || "/dashboard");
    }
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'twitter') => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // 招待リンクから来た場合の戻り先(next)を OAuth 経由でも失わないようにする。
        // これが無いと、招待を受けた人が SNS ログインした瞬間に招待先を見失っていた。
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next || "/dashboard")}`,
      },
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-grid-pattern p-4">
      <PixelCard title="ログイン" className="w-full max-w-md">
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-6 pt-4">
          <PixelInput
            label="メールアドレス"
            type="email"
            placeholder="idea@maker.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PixelInput
            label="パスワード"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <PixelButton type="submit" disabled={loading}>
            {loading ? "読み込み中..." : "ログイン"}
          </PixelButton>

          <div className="flex items-center gap-4 text-stone-400 text-sm">
            <div className="h-px bg-stone-300 flex-1"></div>
            <span>または</span>
            <div className="h-px bg-stone-300 flex-1"></div>
          </div>

          <div className="flex gap-4 justify-center">
            <PixelButton
              type="button"
              variant="secondary"
              className="p-3"
              onClick={() => handleOAuthLogin('google')}
            >
              <FaGoogle className="text-xl" />
            </PixelButton>
            <PixelButton
              type="button"
              variant="secondary"
              className="p-3"
              onClick={() => handleOAuthLogin('github')}
            >
              <FaGithub className="text-xl" />
            </PixelButton>
            <PixelButton
              type="button"
              variant="secondary"
              className="p-3"
              onClick={() => handleOAuthLogin('twitter')}
            >
              <FaTwitter className="text-xl" />
            </PixelButton>
          </div>

          <div className="text-center text-sm">
            <span className="text-stone-500">アカウントをお持ちでないですか？ </span>
            <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="text-[#f97316] font-bold hover:underline">
              新規登録
            </Link>
          </div>
        </form>
      </PixelCard>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
