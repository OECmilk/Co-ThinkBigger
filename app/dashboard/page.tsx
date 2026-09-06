import Link from "next/link";
import { FaPlus, FaFolderOpen, FaArrowRight, FaCheckCircle, FaUsers, FaPlug } from "react-icons/fa";
import { getSupabase, getProfile, getUser } from "@/lib/auth";
import { getProgressForProjects } from "@/lib/project";
import { getStreak } from "@/lib/streak";
import { getActivityFeed, getMemberIndex } from "@/lib/home";
import { getAiStatus } from "@/lib/ai/client";
import { PixelButton } from "@/components/ui/PixelButton";
import { TodayCard } from "@/components/home/TodayCard";
import { StreakStrip } from "@/components/home/StreakStrip";
import { ActivityFeed } from "@/components/home/ActivityFeed";

/**
 * ホーム。
 *
 * 以前は「プロジェクトのカード一覧」だった。
 * それだと開いても次の行動が決まらず、毎日ひらく理由が無い。
 *   1) 今日やること（その場で1行書ける）
 *   2) 自分の継続（連続日数）
 *   3) チームの動き
 * を上から並べ、プロジェクト一覧は下に置く構成に変えた。
 */
export default async function DashboardPage() {
  const supabase = await getSupabase();
  const [user, cachedProfile] = await Promise.all([getUser(), getProfile()]);
  if (!user) return null;

  // トリガー未設定などで Profile が無い場合の保険
  let profile: { id: string; username?: string } | null = cachedProfile;
  if (!profile) {
    const { data: created } = await supabase
      .from("Profile")
      .insert({
        userId: user.id,
        username: user.user_metadata.username || user.email?.split("@")[0] || "User",
      })
      .select()
      .single();
    profile = created;
  }
  if (!profile) return null;

  const { data: rawProjects } = await supabase
    .from("Project")
    .select(
      `id, name, description, updatedAt,
       myMembership:ProjectMember!inner(profileId),
       members:ProjectMember(count)`
    )
    .eq("myMembership.profileId", profile.id)
    .order("updatedAt", { ascending: false });

  const projects = (rawProjects || []).map((p: any) => ({
    id: String(p.id),
    name: p.name,
    description: p.description ?? null,
    updatedAt: p.updatedAt,
    memberCount: p.members?.[0]?.count || 1,
  }));

  const projectIds = projects.map((p) => p.id);

  const [progressMap, streak, memberIndex, aiStatus] = await Promise.all([
    getProgressForProjects(projects),
    getStreak(String(profile.id)),
    getMemberIndex(projectIds),
    getAiStatus(),
  ]);

  const feed = await getActivityFeed(projects, memberIndex);

  // いちばん最近さわったプロジェクトを「今日やること」に据える
  const active = projects[0];
  const activeProgress = active ? progressMap.get(active.id) : undefined;
  const finished = activeProgress ? activeProgress.completed === activeProgress.steps.length : false;

  const displayName = (profile as any).username || user.email?.split("@")[0] || "";

  return (
    <div className="max-w-6xl mx-auto p-2 space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap pt-2">
        <div>
          <h1 className="text-2xl font-bold">
            {displayName ? `${displayName} さん、おかえりなさい` : "おかえりなさい"}
          </h1>
          <p className="text-sm text-[var(--ink-2)] mt-1">
            5分でいいので、今日も1つだけ前に進めましょう。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!aiStatus.configured && (
            <Link href="/dashboard/settings">
              <PixelButton variant="ghost" size="sm">
                <FaPlug /> AIを接続
              </PixelButton>
            </Link>
          )}
          <Link href="/dashboard/projects/new">
            <PixelButton size="sm">
              <FaPlus /> 新規プロジェクト
            </PixelButton>
          </Link>
        </div>
      </header>

      {active && activeProgress ? (
        <TodayCard
          projectId={active.id}
          projectName={active.name}
          stepId={activeProgress.current.id}
          stepNum={activeProgress.current.num}
          stepLabel={activeProgress.current.label}
          stepGoal={activeProgress.current.goal}
          stepDetail={activeProgress.current.detail}
          href={activeProgress.current.href}
          aiReady={aiStatus.configured}
          finished={finished}
        />
      ) : (
        <section className="card-raised p-8 text-center space-y-4">
          <FaFolderOpen className="text-4xl text-[var(--ink-3)] mx-auto" />
          <div>
            <h2 className="text-lg font-bold">最初のプロジェクトを作りましょう</h2>
            <p className="text-sm text-[var(--ink-2)] mt-2 leading-relaxed max-w-md mx-auto">
              THINK BIGGER の6ステップを順番にガイドします。
              思いつかないところは AI と壁打ちしながら進められます。
            </p>
          </div>
          <Link href="/dashboard/projects/new">
            <PixelButton>
              <FaPlus /> プロジェクトを作る
            </PixelButton>
          </Link>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <StreakStrip streak={streak} />
        <ActivityFeed entries={feed} />
      </div>

      {projects.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">プロジェクト</h2>
            <Link
              href="/dashboard/projects/new"
              className="text-xs font-bold text-[var(--ink-2)] hover:text-[var(--accent)] inline-flex items-center gap-1.5"
            >
              <FaPlus className="text-[10px]" /> 追加
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => {
              const progress = progressMap.get(project.id);
              const done = progress ? progress.completed === progress.steps.length : false;

              return (
                <Link
                  key={project.id}
                  href={progress ? progress.current.href : `/dashboard/projects/${project.id}`}
                  className="card p-4 flex flex-col hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm break-words min-w-0">{project.name}</h3>
                    <span className="text-[10px] text-[var(--ink-3)] flex items-center gap-1 shrink-0">
                      <FaUsers /> {project.memberCount}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--ink-2)] line-clamp-2 mb-3 min-h-[2rem]">
                    {project.description || "メイン課題は未設定"}
                  </p>

                  {progress && (
                    <div className="mt-auto space-y-2">
                      <div className="flex gap-[3px]">
                        {progress.steps.map((s) => (
                          <span
                            key={s.id}
                            title={`${s.num}. ${s.label} — ${s.detail}`}
                            className={
                              "h-1.5 flex-1 rounded-full " +
                              (s.done
                                ? "bg-[var(--ok)]"
                                : s.id === progress.current.id
                                  ? "bg-[var(--accent)]"
                                  : "bg-[var(--surface-3)]")
                            }
                          />
                        ))}
                      </div>
                      <p className="text-[11px] font-bold flex items-center gap-1.5 text-[var(--ink-2)]">
                        {done ? (
                          <>
                            <FaCheckCircle className="text-[var(--ok)]" /> 全ステップ完了
                          </>
                        ) : (
                          <>
                            <FaArrowRight className="text-[var(--accent)] text-[10px]" />
                            <span className="truncate">
                              {progress.current.num}. {progress.current.label}
                            </span>
                            <span className="ml-auto text-[var(--ink-3)] tabular">{progress.percent}%</span>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
