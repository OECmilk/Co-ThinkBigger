import Link from "next/link";
import { FaPlus, FaFolderOpen, FaArrowRight, FaCheckCircle, FaUsers } from "react-icons/fa";
import { getSupabase, getProfile, getUser } from "@/lib/auth";
import { getProgressForProjects } from "@/lib/project";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";

export default async function DashboardPage() {
  const supabase = await getSupabase();
  const [user, cachedProfile] = await Promise.all([getUser(), getProfile()]);

  if (!user) return null;

  // トリガー未設定などで Profile が無い場合の保険
  let profile: { id: string } | null = cachedProfile;
  if (!profile) {
    const { data: newProfile } = await supabase
      .from("Profile")
      .insert({
        userId: user.id,
        username: user.user_metadata.username || user.email?.split("@")[0] || "User",
        email: user.email,
      })
      .select()
      .single();
    profile = newProfile;
  }
  if (!profile) return null;

  const { data: projects } = await supabase
    .from("Project")
    .select(
      `id, name, description, updatedAt,
       myMembership:ProjectMember!inner(profileId),
       members:ProjectMember(count)`
    )
    .eq("myMembership.profileId", profile.id)
    .order("updatedAt", { ascending: false });

  const list = (projects || []).map((p: any) => ({
    id: String(p.id),
    name: p.name,
    description: p.description ?? null,
    updatedAt: p.updatedAt,
    memberCount: p.members?.[0]?.count || 1,
  }));

  // 一覧でも「今どこまで進んでいて、次に何をするか」が分かるようにする
  const progressMap = await getProgressForProjects(list);

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-2">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">マイプロジェクト</h1>
          <p className="text-stone-500">前回の続きから再開しましょう。</p>
        </div>
        <Link href="/dashboard/projects/new">
          <PixelButton className="flex items-center gap-2">
            <FaPlus /> <span className="hidden md:inline">新規プロジェクト作成</span>
          </PixelButton>
        </Link>
      </div>

      {list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {list.map((project) => {
            const progress = progressMap.get(project.id);
            const finished = progress ? progress.completed === progress.steps.length : false;

            return (
              <Link key={project.id} href={progress ? progress.current.href : `/dashboard/projects/${project.id}`}>
                <PixelCard className="h-full flex flex-col hover:-translate-y-1 transition-transform cursor-pointer bg-white hover:bg-orange-50/40">
                  <div className="flex justify-between items-start mb-3">
                    <FaFolderOpen className="text-3xl text-[#f97316]" />
                    <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-1 flex items-center gap-1">
                      <FaUsers /> {project.memberCount}人
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-1 break-words">{project.name}</h3>
                  <p className="text-stone-500 text-xs line-clamp-2 mb-4 min-h-[2rem]">
                    {project.description || "メイン課題は未設定です"}
                  </p>

                  {progress && (
                    <div className="mt-auto space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-stone-500 mb-1">
                          <span>
                            {progress.completed} / {progress.steps.length} ステップ完了
                          </span>
                          <span>{progress.percent}%</span>
                        </div>
                        <div className="h-2 bg-stone-200 overflow-hidden">
                          <div
                            className={finished ? "h-full bg-emerald-500" : "h-full bg-[#f97316]"}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>

                      {/* ステップごとの状態を点で表す */}
                      <div className="flex gap-1">
                        {progress.steps.map((s) => (
                          <span
                            key={s.id}
                            title={`${s.num}. ${s.label} — ${s.detail}`}
                            className={
                              "h-1.5 flex-1 " +
                              (s.done
                                ? "bg-emerald-500"
                                : s.id === progress.current.id
                                  ? "bg-[#f97316]"
                                  : "bg-stone-200")
                            }
                          />
                        ))}
                      </div>

                      <div
                        className={
                          "flex items-center gap-2 text-xs font-bold p-2 " +
                          (finished ? "bg-emerald-50 text-emerald-800" : "bg-orange-50 text-orange-900")
                        }
                      >
                        {finished ? (
                          <>
                            <FaCheckCircle className="shrink-0" /> 全ステップ完了！
                          </>
                        ) : (
                          <>
                            <FaArrowRight className="shrink-0" />
                            <span className="truncate">
                              次: {progress.current.num}. {progress.current.label}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </PixelCard>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-stone-300 text-stone-400 bg-white/50">
          <FaFolderOpen className="text-6xl mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2 text-stone-600">プロジェクトはまだありません</h3>
          <p className="mb-6 text-center text-sm">
            プロジェクトを作ると、THINK BIGGER の 6 ステップが順番にガイドされます。
            <br />
            招待リンクを送れば、離れたメンバーもそのまま参加できます。
          </p>
          <Link href="/dashboard/projects/new">
            <PixelButton>最初のプロジェクトを作成</PixelButton>
          </Link>
        </div>
      )}
    </div>
  );
}
