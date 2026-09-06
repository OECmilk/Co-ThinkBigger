import { getProfile, getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PixelButton } from "@/components/ui/PixelButton";
import { FaSignOutAlt, FaPlug, FaHome } from "react-icons/fa";
import { ProfileLink } from "@/components/ProfileLink";
import { FeedbackProvider } from "@/components/ui/Feedback";
import { NotificationBell } from "@/components/project/NotificationBell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getUser / getProfile はリクエスト単位でメモ化されているため、
  // 配下の layout / page が同じものを呼んでも往復は増えない。
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile();

  return (
    // 操作結果のトーストと確認ダイアログをアプリ全体で共有する
    <FeedbackProvider>
      <div className="min-h-screen flex flex-col bg-grid-pattern">
        <header className="border-b-2 border-[var(--line-strong)] bg-white sticky top-0 z-50">
          <div className="w-full px-4 h-16 flex justify-between items-center gap-4">
            <Link
              href="/dashboard"
              className="text-base md:text-lg font-bold tracking-widest text-[var(--accent)] shrink-0 flex items-center gap-2 font-display"
            >
              <FaHome className="text-[var(--ink)] text-sm" />
              <span className="text-[var(--ink)]">CO-</span>THINK BIGGER
            </Link>

            <div className="flex items-center gap-3 md:gap-4">
              {/* 自分がいない間にチームで起きたことの入口 */}
              {profile && <NotificationBell profileId={String(profile.id)} />}

              <Link
                href="/dashboard/settings"
                className="p-2 pixel-border-sm bg-white hover:bg-[var(--surface-2)] transition-colors"
                title="AI接続などの設定"
                aria-label="設定"
              >
                <FaPlug className="text-[var(--ink-2)]" />
              </Link>

              <ProfileLink profile={profile} user={user} />

              <form action="/auth/signout" method="post">
                <PixelButton variant="secondary" className="px-3 py-1 text-xs" title="ログアウト">
                  <FaSignOutAlt />
                </PixelButton>
              </form>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full mx-auto p-2 md:p-4 min-w-0">{children}</main>
      </div>
    </FeedbackProvider>
  );
}
