import { cache } from "react";
import { getSupabase, getProfile } from "@/lib/auth";

/**
 * プロジェクトの「今の状態」を 1 リクエストにつき 1 回だけまとめて取得する。
 *
 * layout（サイドバーの進捗）・各ステップのページ・フッターの次アクション判定が
 * すべてこのスナップショットを共有するので、画面を跨いでも取得は 1 バッチで済む。
 * STEP 2〜6 が扱うテーブルはどれも 1 プロジェクトあたり数十行規模なので、
 * 全行をここで取り切ってしまう方が、ページごとに引き直すより速く、
 * かつ「前のステップの状況」を各画面で説明できるようになる。
 */

export type MemberProfile = {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
};

export type Member = { role: string; profile: MemberProfile };

export type SubProblem = {
  id: string;
  title: string;
  order: number;
  authorId: string | null;
  isShared: boolean;
  createdAt: string;
};

export type DesireType = "self" | "target" | "third-party";

export type Desire = {
  id: string;
  type: DesireType;
  content: string;
  authorId: string | null;
  isShared: boolean;
  createdAt: string;
};

export type Choice = {
  id: string;
  subProblemId: string;
  title: string;
  sourceURL: string | null;
  isOutsideDomain: boolean;
  authorId: string | null;
  isShared: boolean;
  createdAt: string;
};

export type Solution = {
  id: string;
  name: string;
  description: string | null;
  components: Record<string, string>;
  authorId?: string | null;
  createdAt: string;
};

export type Evaluation = { id: string; solutionId: string; desireId: string; score: number };

export type ProjectSnapshot = {
  id: string;
  name: string;
  description: string;
  inviteCode: string | null;
  members: Member[];
  memberByProfileId: Map<string, MemberProfile>;
  memberByUserId: Map<string, MemberProfile>;
  candidateCount: number;
  subProblems: SubProblem[];
  desires: Desire[];
  choices: Choice[];
  solutions: Solution[];
  evaluations: Evaluation[];
};

export const getProjectSnapshot = cache(async (projectId: string): Promise<ProjectSnapshot> => {
  const supabase = await getSupabase();

  const [projectRes, membersRes, candidateRes, subRes, desireRes, choiceRes, solutionRes, evalRes] =
    await Promise.all([
      supabase.from("Project").select("id, name, description, inviteCode").eq("id", projectId).single(),
      supabase
        .from("ProjectMember")
        .select("role, profile:Profile(id, userId, username, avatarUrl)")
        .eq("projectId", projectId),
      supabase.from("Candidate").select("id", { count: "exact", head: true }).eq("projectId", projectId),
      supabase.from("SubProblem").select("*").eq("projectId", projectId).order("order").order("createdAt"),
      supabase.from("Desire").select("*").eq("projectId", projectId).order("createdAt"),
      // Choice は projectId を持たないので、このプロジェクトのサブ課題経由で絞る
      supabase.from("Choice").select("*, subProblem:SubProblem!inner(projectId)").eq("subProblem.projectId", projectId),
      supabase.from("Solution").select("*").eq("projectId", projectId).order("createdAt", { ascending: false }),
      supabase.from("Evaluation").select("*, solution:Solution!inner(projectId)").eq("solution.projectId", projectId),
    ]);

  const members: Member[] = (membersRes.data || []).map((m: any) => ({
    role: m.role,
    profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
  })).filter((m: Member) => !!m.profile);

  const memberByProfileId = new Map(members.map((m) => [String(m.profile.id), m.profile]));
  const memberByUserId = new Map(members.map((m) => [String(m.profile.userId), m.profile]));

  const norm = <T extends { id: any }>(rows: any[]): T[] =>
    (rows || []).map((r) => ({ ...r, id: String(r.id) }));

  return {
    id: String(projectId),
    name: projectRes.data?.name || "Project",
    description: projectRes.data?.description || "",
    inviteCode: projectRes.data?.inviteCode ?? null,
    members,
    memberByProfileId,
    memberByUserId,
    candidateCount: candidateRes.count || 0,
    subProblems: norm<SubProblem>(subRes.data || []),
    desires: norm<Desire>(desireRes.data || []),
    choices: norm<Choice>((choiceRes.data || []).map((c: any) => ({ ...c, subProblemId: String(c.subProblemId) }))),
    solutions: norm<Solution>(solutionRes.data || []),
    evaluations: norm<Evaluation>(
      (evalRes.data || []).map((e: any) => ({ ...e, solutionId: String(e.solutionId), desireId: String(e.desireId) }))
    ),
  };
});

/* ============================================================
 * 進捗モデル
 *
 * THINK BIGGER は順序に意味がある手法なので、
 *「今どこにいて、このステップは何をもって終わりで、次は何か」を
 * 1 か所で定義して、サイドバー・フッター・ダッシュボードで共有する。
 * ========================================================== */

export type StepId = "step1" | "step2" | "step3" | "step4" | "step5" | "step6";

export type StepProgress = {
  id: StepId;
  num: number;
  label: string;
  href: string;
  /** このステップの完了条件（ユーザーに見せる文言） */
  goal: string;
  /** 完了したか */
  done: boolean;
  /** 着手済みか（1 件でも自分たちのデータがあるか） */
  started: boolean;
  /** 「3 / 5 件」のような進み具合 */
  detail: string;
  /** 進められない理由と、戻るべきステップ */
  blocker: { message: string; goTo: StepId } | null;
};

export type ProjectProgress = {
  steps: StepProgress[];
  /** 次に手をつけるべきステップ */
  current: StepProgress;
  completed: number;
  percent: number;
};

const href = (projectId: string, step: StepId) => `/dashboard/projects/${projectId}/${step}`;

export function buildProgress(snap: ProjectSnapshot): ProjectProgress {
  const p = snap.id;

  const sharedSubs = snap.subProblems.filter((s) => s.isShared);
  const sharedDesires = snap.desires.filter((d) => d.isShared);
  const sharedChoices = snap.choices.filter((c) => c.isShared);
  const sharedSubIds = new Set(sharedSubs.map((s) => s.id));
  const choicesForSharedSubs = sharedChoices.filter((c) => sharedSubIds.has(c.subProblemId));

  const desireTypes: DesireType[] = ["self", "target", "third-party"];
  const coveredDesireTypes = desireTypes.filter((t) => sharedDesires.some((d) => d.type === t));

  const subsWithChoice = sharedSubs.filter((s) => choicesForSharedSubs.some((c) => c.subProblemId === s.id));
  const hasOutside = choicesForSharedSubs.some((c) => c.isOutsideDomain);

  const evaluatedSolutionIds = new Set(snap.evaluations.map((e) => e.solutionId));
  const evaluatedSolutions = snap.solutions.filter((s) => evaluatedSolutionIds.has(s.id));

  const step1Done = snap.description.trim().length > 0;
  const step2Done = sharedSubs.length >= 3;
  const step3Done = coveredDesireTypes.length === 3;
  const step4Done = sharedSubs.length > 0 && subsWithChoice.length === sharedSubs.length && hasOutside;
  const step5Done = snap.solutions.length > 0;
  const step6Done = evaluatedSolutions.length > 0;

  const steps: StepProgress[] = [
    {
      id: "step1",
      num: 1,
      label: "課題候補",
      href: href(p, "step1"),
      goal: "課題候補を出し合い、取り組む「メイン課題」を1つ決める",
      done: step1Done,
      started: snap.candidateCount > 0,
      detail: step1Done ? "メイン課題を決定済み" : `候補 ${snap.candidateCount} 件`,
      blocker: null,
    },
    {
      id: "step2",
      num: 2,
      label: "課題分解",
      href: href(p, "step2"),
      goal: "メイン課題を3つ以上のサブ課題に分解し、チームに共有する",
      done: step2Done,
      started: snap.subProblems.length > 0,
      detail: `共有済み ${sharedSubs.length} / 3 件`,
      blocker: step1Done
        ? null
        : { message: "メイン課題がまだ決まっていません。", goTo: "step1" },
    },
    {
      id: "step3",
      num: 3,
      label: "要望分析",
      href: href(p, "step3"),
      goal: "自分・ターゲット・第三者、3つの視点それぞれの望みを共有する",
      done: step3Done,
      started: snap.desires.length > 0,
      detail: `視点 ${coveredDesireTypes.length} / 3 をカバー`,
      blocker: step1Done
        ? null
        : { message: "メイン課題がまだ決まっていません。", goTo: "step1" },
    },
    {
      id: "step4",
      num: 4,
      label: "選択マップ",
      href: href(p, "step4"),
      goal: "各サブ課題に先行事例を集める。1つ以上は必ず「領域外」から",
      done: step4Done,
      started: snap.choices.length > 0,
      detail:
        sharedSubs.length === 0
          ? "共有サブ課題がありません"
          : `${subsWithChoice.length} / ${sharedSubs.length} のサブ課題に事例あり${hasOutside ? "・領域外あり" : "・領域外なし"}`,
      blocker:
        sharedSubs.length === 0
          ? { message: "チームに共有されたサブ課題がまだありません。", goTo: "step2" }
          : null,
    },
    {
      id: "step5",
      num: 5,
      label: "組み合わせ",
      href: href(p, "step5"),
      goal: "サブ課題ごとに事例を1つずつ選び、解決策として保存する",
      done: step5Done,
      started: snap.solutions.length > 0,
      detail: `解決策 ${snap.solutions.length} 件`,
      blocker:
        choicesForSharedSubs.length === 0
          ? { message: "組み合わせる先行事例がまだ共有されていません。", goTo: "step4" }
          : null,
    },
    {
      id: "step6",
      num: 6,
      label: "評価",
      href: href(p, "step6"),
      goal: "解決策が3つの視点の望みをどれだけ満たすかを評価し、本命を決める",
      done: step6Done,
      started: snap.evaluations.length > 0,
      detail: `評価済み ${evaluatedSolutions.length} / ${snap.solutions.length} 件`,
      blocker:
        snap.solutions.length === 0
          ? { message: "評価する解決策がまだありません。", goTo: "step5" }
          : sharedDesires.length === 0
            ? { message: "評価軸になる「望み」がまだ共有されていません。", goTo: "step3" }
            : null,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const current = steps.find((s) => !s.done) ?? steps[steps.length - 1];

  return {
    steps,
    current,
    completed,
    percent: Math.round((completed / steps.length) * 100),
  };
}

export const getProjectProgress = cache(async (projectId: string): Promise<ProjectProgress> => {
  return buildProgress(await getProjectSnapshot(projectId));
});

/** 自分の Profile.id（スナップショットと同じリクエスト内で使い回す） */
export const getMyProfileId = cache(async (): Promise<string | null> => {
  const profile = await getProfile();
  return profile ? String(profile.id) : null;
});

/**
 * 一覧画面用に、複数プロジェクトの進捗をまとめて計算する。
 *
 * プロジェクトごとに getProjectSnapshot を呼ぶとクエリ数が件数倍になるので、
 * ここではテーブルごとに 1 回ずつ引いてから projectId で振り分ける。
 * （プロジェクトが 20 件でもクエリは 6 本のまま）
 */
export async function getProgressForProjects(
  projects: { id: string; name: string; description: string | null }[]
): Promise<Map<string, ProjectProgress>> {
  const result = new Map<string, ProjectProgress>();
  if (projects.length === 0) return result;

  const supabase = await getSupabase();
  const ids = projects.map((p) => p.id);

  const [candidateRes, subRes, desireRes, choiceRes, solutionRes, evalRes] = await Promise.all([
    supabase.from("Candidate").select("projectId").in("projectId", ids),
    supabase.from("SubProblem").select("id, projectId, isShared").in("projectId", ids),
    supabase.from("Desire").select("id, projectId, type, isShared").in("projectId", ids),
    supabase
      .from("Choice")
      .select("id, subProblemId, isShared, isOutsideDomain, subProblem:SubProblem!inner(projectId)")
      .in("subProblem.projectId", ids),
    supabase.from("Solution").select("id, projectId").in("projectId", ids),
    supabase
      .from("Evaluation")
      .select("id, solutionId, desireId, solution:Solution!inner(projectId)")
      .in("solution.projectId", ids),
  ]);

  const bucket = <T>(rows: any[] | null, key: (row: any) => string) => {
    const map = new Map<string, T[]>();
    (rows || []).forEach((row) => {
      const k = String(key(row));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(row);
    });
    return map;
  };

  const subByProject = bucket<any>(subRes.data, (r) => r.projectId);
  const desireByProject = bucket<any>(desireRes.data, (r) => r.projectId);
  const solutionByProject = bucket<any>(solutionRes.data, (r) => r.projectId);
  const candidateByProject = bucket<any>(candidateRes.data, (r) => r.projectId);
  const choiceByProject = bucket<any>(choiceRes.data, (r) => r.subProblem?.projectId);
  const evalByProject = bucket<any>(evalRes.data, (r) => r.solution?.projectId);

  for (const project of projects) {
    const key = String(project.id);
    const snapshot: ProjectSnapshot = {
      id: key,
      name: project.name,
      description: project.description || "",
      inviteCode: null,
      members: [],
      memberByProfileId: new Map(),
      memberByUserId: new Map(),
      candidateCount: (candidateByProject.get(key) || []).length,
      subProblems: (subByProject.get(key) || []).map((s: any) => ({
        id: String(s.id),
        title: "",
        order: 0,
        authorId: null,
        isShared: !!s.isShared,
        createdAt: "",
      })),
      desires: (desireByProject.get(key) || []).map((d: any) => ({
        id: String(d.id),
        type: d.type,
        content: "",
        authorId: null,
        isShared: !!d.isShared,
        createdAt: "",
      })),
      choices: (choiceByProject.get(key) || []).map((c: any) => ({
        id: String(c.id),
        subProblemId: String(c.subProblemId),
        title: "",
        sourceURL: null,
        isOutsideDomain: !!c.isOutsideDomain,
        authorId: null,
        isShared: !!c.isShared,
        createdAt: "",
      })),
      solutions: (solutionByProject.get(key) || []).map((s: any) => ({
        id: String(s.id),
        name: "",
        description: null,
        components: {},
        createdAt: "",
      })),
      evaluations: (evalByProject.get(key) || []).map((e: any) => ({
        id: String(e.id),
        solutionId: String(e.solutionId),
        desireId: String(e.desireId),
        score: 1,
      })),
    };

    result.set(key, buildProgress(snapshot));
  }

  return result;
}
