"use client";

import { PixelCard } from "@/components/ui/PixelCard";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Suspense } from "react";

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    // Signup logic...
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      alert("Signup failed: " + error.message);
    } else {
      if (data.user) {
        // Create Profile immediately
        const { error: profileError } = await supabase.from('Profile').insert({
          id: crypto.randomUUID(),
          userId: data.user.id,
          username: username || email.split('@')[0],
        });

        if (profileError) {
          console.error("Profile creation failed (non-fatal):", profileError);
        }
      }

      if (data.session) {
        router.push(next || "/dashboard");
      } else {
        alert("登録が完了しました！認証メールをご確認ください。");
        router.push("/login?next=" + encodeURIComponent(next || "/dashboard"));
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-grid-pattern p-4">
      <PixelCard title="新規登録" className="w-full max-w-md">
        <form onSubmit={handleSignup} className="flex flex-col gap-6 pt-4">
          <PixelInput
            label="ユーザー名"
            type="text"
            placeholder="IdeaGenius"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
            {loading ? "作成中..." : "アカウント作成"}
          </PixelButton>

          <div className="text-center text-sm">
            <span className="text-stone-500">すでにアカウントをお持ちですか？ </span>
            <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-[#f97316] font-bold hover:underline">
              ログイン
            </Link>
          </div>
        </form>
      </PixelCard>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
