import { createClient } from "@/lib/supabase/server";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import Link from "next/link";
import { FaPlus, FaFolderOpen } from "react-icons/fa";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Ensure Profile exists (lazy creation fallback if trigger failed/not set)
  // Ideally this is handled by database triggers
  let { data: profile } = await supabase
    .from('Profile')
    .select('*')
    .eq('userId', user.id)
    .single();

  if (!profile) {
    const { data: newProfile, error } = await supabase
      .from('Profile')
      .insert({
        userId: user.id,
        username: user.user_metadata.username || user.email?.split('@')[0] || 'User',
        email: user.email, // Note: Schema needs update if we want to store email in Profile or just rely on join
      })
      .select()
      .single();

    if (!error) profile = newProfile;
  }

  // Fetch Projects where user is a member
  const { data: projects } = await supabase
    .from('Project')
    .select(`
      *,
      myMembership:ProjectMember!inner(profileId),
      members:ProjectMember(count)
    `)
    .eq('myMembership.profileId', profile.id)
    .order('updatedAt', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">マイプロジェクト</h1>
          <p className="text-stone-500">アイデア創出の旅を続けましょう。</p>
        </div>
        <Link href="/dashboard/projects/new">
          <PixelButton className="flex items-center gap-2">
            <FaPlus /> <span className="hidden md:inline">新規プロジェクト作成</span>
          </PixelButton>
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <PixelCard className="h-full hover:translate-y-[-4px] transition-transform cursor-pointer bg-white hover:bg-orange-50">
                <div className="flex justify-between items-start mb-4">
                  <FaFolderOpen className="text-4xl text-[#f97316]" />
                  <span className="text-xs bg-stone-200 px-2 py-1 pixel-border-sm">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 truncate">{project.name}</h3>
                <p className="text-stone-500 text-sm line-clamp-2 h-10">
                  {project.description || "説明なし"}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-stone-400">
                  <span>メンバー: {project.members?.[0]?.count || 1}人</span>
                </div>
              </PixelCard>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-stone-300 rounded-lg text-stone-400">
          <FaFolderOpen className="text-6xl mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">プロジェクトはまだありません</h3>
          <p className="mb-6">新しいプロジェクトを作成して、THINK BIGGERを始めましょう。</p>
          <Link href="/dashboard/projects/new">
            <PixelButton>最初のプロジェクトを作成</PixelButton>
          </Link>
        </div>
      )}
    </div>
  );
}
