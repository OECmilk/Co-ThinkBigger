import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PixelButton } from "@/components/ui/PixelButton";
import { FaSignOutAlt } from "react-icons/fa";
import { ProfileLink } from "@/components/ProfileLink";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("Profile")
    .select("id, avatarUrl")
    .eq("userId", user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col bg-grid-pattern">
      {/* Top Navigation */}
      <header className="border-b-4 border-stone-800 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold tracking-widest text-[#f97316]">
            <span className="text-stone-800">CO-</span>THINK BIGGER
          </Link>

          <div className="flex items-center gap-4">
            <ProfileLink profile={profile} user={user} />

            <form action="/auth/signout" method="post">
              <PixelButton variant="secondary" className="px-3 py-1 text-xs">
                <FaSignOutAlt />
              </PixelButton>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto p-2 md:p-4">
        {children}
      </main>
    </div>
  );
}
