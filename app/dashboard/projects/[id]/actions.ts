"use server";

import { revalidatePath } from "next/cache";
import { getProfile, getProjectMembership, getSupabase } from "@/lib/auth";
import { notifyProjectMembers } from "@/lib/notifications";
import { BADGE_LEVELS, getBadge, type BadgeType } from "@/lib/badges";
import { bumpActivity } from "@/lib/streak";

/**
 * すべての server action は例外を投げずに { error } を返す規約に統一する。
 * クライアント側は useAction が受け取ってトーストに出すので、
 * 「押したのに何も起きない」「失敗が黙って消える」が起きなくなる。
 */
export type ActionResult = {
  error?: string;
  success?: true;
  /** 今回の操作で新しく解除された実績（クライアントで祝う） */
  unlocked?: { label: string; icon: string }[];
};

const fail = (message: string): ActionResult => ({ error: message });

/** プロジェクトのメンバーであることを確かめ、自分の Profile を返す */
async function requireMember(projectId: string) {
  const [profile, membership] = await Promise.all([getProfile(), getProjectMembership(projectId)]);
  if (!profile) return { error: "ログインが必要です。" as const, profile: null, role: null };
  if (!membership) return { error: "このプロジェクトのメンバーではありません。" as const, profile: null, role: null };
  return { error: null, profile, role: membership.role as string };
}

const stepPath = (projectId: string, step: string) => `/dashboard/projects/${projectId}/${step}`;

/** ステップ間で影響が波及するので、関係するページをまとめて無効化する */
function revalidateProject(projectId: string, ...steps: string[]) {
  for (const s of steps) revalidatePath(stepPath(projectId, s));
  revalidatePath("/dashboard");
}

/* ============================================================
 * 実績
 * ========================================================== */

const ACHIEVEMENT_SOURCES: Record<BadgeType, { table: string; column: "authorId" }> = {
  CANDIDATE: { table: "Candidate", column: "authorId" }, // Candidate.authorId は Auth の user id
  SUBPROBLEM: { table: "SubProblem", column: "authorId" },
  DESIRE: { table: "Desire", column: "authorId" },
  CHOICE: { table: "Choice", column: "authorId" },
  SOLUTION: { table: "Solution", column: "authorId" },
};

async function unlockAchievements(
  profileId: string,
  userId: string,
  type: BadgeType
): Promise<ActionResult["unlocked"]> {
  try {
    const supabase = await getSupabase();
    const source = ACHIEVEMENT_SOURCES[type];
    // Candidate だけ authorId が Auth の user id を持つ（他は Profile.id）
    const ownerValue = type === "CANDIDATE" ? userId : profileId;

    const { count, error } = await supabase
      .from(source.table)
      .select("id", { count: "exact", head: true })
      .eq(source.column, ownerValue);

    // 列が無い環境ではバッジ計算だけ諦める（本体の操作は成功させる）
    if (error) return [];

    const reached = BADGE_LEVELS.filter((l) => (count || 0) >= l);
    if (reached.length === 0) return [];

    const ids = reached.map((l) => `${type}_${l}`);
    const { data: existing } = await supabase
      .from("Achievement")
      .select("badgeType")
      .eq("profileId", profileId)
      .in("badgeType", ids);

    const have = new Set((existing || []).map((a: any) => a.badgeType));
    const fresh = ids.filter((id) => !have.has(id));
    if (fresh.length === 0) return [];

    await supabase
      .from("Achievement")
      .insert(fresh.map((badgeType) => ({ profileId, badgeType })));

    return fresh
      .map((id) => getBadge(id))
      .filter(Boolean)
      .map((b) => ({ label: b!.label, icon: b!.icon }));
  } catch {
    return [];
  }
}

/* ============================================================
 * STEP 1: 課題候補
 * ========================================================== */

export async function addCandidate(projectId: string, title: string): Promise<ActionResult> {
  const { error, profile } = await requireMember(projectId);
  if (error) return fail(error);

  const trimmed = title.trim();
  if (!trimmed) return fail("課題を入力してください。");

  const supabase = await getSupabase();
  const { error: insertError } = await supabase.from("Candidate").insert({
    projectId,
    title: trimmed,
    authorId: profile!.userId,
  });
  if (insertError) return fail("課題候補の追加に失敗しました。");

  await bumpActivity(profile!.id);
  const unlocked = await unlockAchievements(profile!.id, profile!.userId, "CANDIDATE");

  await notifyProjectMembers({
    projectId,
    actorProfileId: profile!.id,
    title: "新しい課題候補",
    content: `${profile!.username} さんが「${trimmed}」を追加しました`,
    link: stepPath(projectId, "step1"),
  });

  revalidateProject(projectId, "step1");
  return { success: true, unlocked };
}

export async function rateCandidate(candidateId: string, projectId: string, score: number): Promise<ActionResult> {
  const { error, profile } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("Reaction")
    .select("id")
    .eq("candidateId", candidateId)
    .eq("profileId", profile!.id)
    .maybeSingle();

  const result = existing
    ? await supabase.from("Reaction").update({ score }).eq("id", existing.id)
    : await supabase.from("Reaction").insert({ candidateId, profileId: profile!.id, score });

  if (result.error) return fail("評価の保存に失敗しました。");

  revalidateProject(projectId, "step1");
  return { success: true };
}

export async function updateCandidate(id: string, projectId: string, title: string): Promise<ActionResult> {
  const { error, profile, role } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { data: candidate } = await supabase.from("Candidate").select("authorId").eq("id", id).single();
  if (!candidate) return fail("対象が見つかりません。");
  if (candidate.authorId !== profile!.userId && role !== "owner") {
    return fail("編集できるのは投稿者本人（またはオーナー）だけです。");
  }

  const { error: updateError } = await supabase.from("Candidate").update({ title: title.trim() }).eq("id", id);
  if (updateError) return fail("更新に失敗しました。");

  revalidateProject(projectId, "step1");
  return { success: true };
}

export async function deleteCandidate(id: string, projectId: string): Promise<ActionResult> {
  const { error, profile, role } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { data: candidate } = await supabase.from("Candidate").select("authorId").eq("id", id).single();
  if (!candidate) return fail("対象が見つかりません。");
  if (candidate.authorId !== profile!.userId && role !== "owner") {
    return fail("削除できるのは投稿者本人（またはオーナー）だけです。");
  }

  const { error: deleteError } = await supabase.from("Candidate").delete().eq("id", id);
  if (deleteError) return fail("削除に失敗しました。");

  revalidateProject(projectId, "step1");
  return { success: true };
}

/** 課題候補を「メイン課題」に採用する。チーム全員の前提が変わるので必ず通知する。 */
export async function setMainProblem(projectId: string, description: string): Promise<ActionResult> {
  const { error, profile } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { error: updateError } = await supabase
    .from("Project")
    .update({ description })
    .eq("id", projectId);
  if (updateError) return fail("メイン課題の設定に失敗しました。");

  await notifyProjectMembers({
    projectId,
    actorProfileId: profile!.id,
    title: "メイン課題が決まりました",
    content: `${profile!.username} さんが「${description}」をメイン課題に設定しました`,
    link: stepPath(projectId, "step2"),
  });

  revalidateProject(projectId, "step1", "step2", "step3", "step4", "step5", "step6");
  return { success: true };
}

/* ============================================================
 * STEP 2: 課題分解
 * ========================================================== */

export async function updateProjectDescription(projectId: string, description: string): Promise<ActionResult> {
  return setMainProblem(projectId, description.trim());
}

export async function addSubProblem(projectId: string, title: string): Promise<ActionResult> {
  const { error, profile } = await requireMember(projectId);
  if (error) return fail(error);

  const trimmed = title.trim();
  if (!trimmed) return fail("サブ課題を入力してください。");

  const supabase = await getSupabase();
  const { error: insertError } = await supabase.from("SubProblem").insert({
    projectId,
    title: trimmed,
    order: 0,
    authorId: profile!.id,
    isShared: false,
  });
  if (insertError) return fail("サブ課題の追加に失敗しました。");

  await bumpActivity(profile!.id);
  const unlocked = await unlockAchievements(profile!.id, profile!.userId, "SUBPROBLEM");
  revalidateProject(projectId, "step2");
  return { success: true, unlocked };
}

export async function deleteSubProblem(id: string, projectId: string): Promise<ActionResult> {
  const { error, profile, role } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { data: sub } = await supabase.from("SubProblem").select("authorId, isShared").eq("id", id).single();
  if (!sub) return fail("対象が見つかりません。");
  if (sub.authorId !== profile!.id && role !== "owner") {
    return fail("削除できるのは作成者本人（またはオーナー）だけです。");
  }

  const { error: deleteError } = await supabase.from("SubProblem").delete().eq("id", id);
  if (deleteError) return fail("削除に失敗しました。");

  // サブ課題を消すと、そこにぶら下がる先行事例と、
  // それを使った解決策の構成が影響を受けるので後続も作り直す
  revalidateProject(projectId, "step2", "step4", "step5", "step6");
  return { success: true };
}

/* ============================================================
 * 共有 / 共有解除
 * ========================================================== */

/**
 * 本文の列名がテーブルごとに違う（SubProblem/Choice は title、Desire は content）。
 * ここを一律 "title, content" で引くと、存在しない列を要求して
 * クエリ自体が失敗し、「対象が見つかりません」になってしまうので
 * テーブルごとに正しい列を持たせる。
 */
const SHARE_TARGETS = {
  subProblem: {
    table: "SubProblem",
    textColumn: "title",
    step: "step2",
    label: "サブ課題",
    after: ["step2", "step4", "step5"],
  },
  desire: {
    table: "Desire",
    textColumn: "content",
    step: "step3",
    label: "望み",
    after: ["step3", "step6"],
  },
  choice: {
    table: "Choice",
    textColumn: "title",
    step: "step4",
    label: "先行事例",
    after: ["step4", "step5"],
  },
} as const;

export type ShareTarget = keyof typeof SHARE_TARGETS;

export async function setShared(
  type: ShareTarget,
  id: string,
  projectId: string,
  isShared: boolean
): Promise<ActionResult> {
  const { error, profile, role } = await requireMember(projectId);
  if (error) return fail(error);

  const target = SHARE_TARGETS[type];
  const supabase = await getSupabase();

  const { data: row, error: selectError } = await supabase
    .from(target.table)
    .select(`authorId, ${target.textColumn}`)
    .eq("id", id)
    .maybeSingle();

  if (selectError) return fail("対象の取得に失敗しました。");
  if (!row) return fail("対象が見つかりません。");
  if (String((row as any).authorId) !== String(profile!.id) && role !== "owner") {
    return fail("共有状態を変えられるのは作成者本人（またはオーナー）だけです。");
  }

  const { error: updateError } = await supabase.from(target.table).update({ isShared }).eq("id", id);
  if (updateError) return fail("共有状態の変更に失敗しました。");

  if (isShared) {
    await notifyProjectMembers({
      projectId,
      actorProfileId: profile!.id,
      title: `${target.label}が共有されました`,
      content: `${profile!.username} さんが「${(row as any)[target.textColumn] ?? ""}」をチームに共有しました`,
      link: stepPath(projectId, target.step),
    });
  }

  revalidateProject(projectId, ...target.after);
  return { success: true };
}

/* ============================================================
 * STEP 3: 要望分析
 * ========================================================== */

export async function addDesire(
  projectId: string,
  type: "self" | "target" | "third-party",
  content: string
): Promise<ActionResult> {
  const { error, profile } = await requireMember(projectId);
  if (error) return fail(error);

  const trimmed = content.trim();
  if (!trimmed) return fail("望みを入力してください。");

  const supabase = await getSupabase();
  const { error: insertError } = await supabase.from("Desire").insert({
    projectId,
    type,
    content: trimmed,
    authorId: profile!.id,
    isShared: false,
  });
  if (insertError) return fail("望みの追加に失敗しました。");

  await bumpActivity(profile!.id);
  const unlocked = await unlockAchievements(profile!.id, profile!.userId, "DESIRE");
  revalidateProject(projectId, "step3");
  return { success: true, unlocked };
}

export async function deleteDesire(id: string, projectId: string): Promise<ActionResult> {
  const { error, profile, role } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { data: desire } = await supabase.from("Desire").select("authorId").eq("id", id).single();
  if (!desire) return fail("対象が見つかりません。");
  if (desire.authorId !== profile!.id && role !== "owner") {
    return fail("削除できるのは作成者本人（またはオーナー）だけです。");
  }

  const { error: deleteError } = await supabase.from("Desire").delete().eq("id", id);
  if (deleteError) return fail("削除に失敗しました。");

  revalidateProject(projectId, "step3", "step6");
  return { success: true };
}

/* ============================================================
 * STEP 4: 選択マップ
 * ========================================================== */

export async function addChoice(
  subProblemId: string,
  projectId: string,
  title: string,
  isOutsideDomain: boolean,
  sourceURL?: string
): Promise<ActionResult> {
  const { error, profile } = await requireMember(projectId);
  if (error) return fail(error);

  const trimmed = title.trim();
  if (!trimmed) return fail("事例のタイトルを入力してください。");

  const supabase = await getSupabase();
  const { error: insertError } = await supabase.from("Choice").insert({
    subProblemId,
    title: trimmed,
    isOutsideDomain,
    sourceURL: sourceURL?.trim() || null,
    authorId: profile!.id,
    isShared: false,
  });
  if (insertError) return fail("先行事例の追加に失敗しました。");

  await bumpActivity(profile!.id);
  const unlocked = await unlockAchievements(profile!.id, profile!.userId, "CHOICE");
  revalidateProject(projectId, "step4", "step5");
  return { success: true, unlocked };
}

export async function deleteChoice(id: string, projectId: string): Promise<ActionResult> {
  const { error, profile, role } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { data: choice } = await supabase.from("Choice").select("authorId").eq("id", id).single();
  if (!choice) return fail("対象が見つかりません。");
  if (choice.authorId !== profile!.id && role !== "owner") {
    return fail("削除できるのは作成者本人（またはオーナー）だけです。");
  }

  const { error: deleteError } = await supabase.from("Choice").delete().eq("id", id);
  if (deleteError) return fail("削除に失敗しました。");

  revalidateProject(projectId, "step4", "step5");
  return { success: true };
}

/* ============================================================
 * STEP 5: 組み合わせ
 * ========================================================== */

function isSameComponents(a: Record<string, string>, b: any) {
  if (!b) return false;
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]);
}

export async function saveSolution(
  projectId: string,
  name: string,
  description: string,
  components: Record<string, string>
): Promise<ActionResult> {
  const { error, profile } = await requireMember(projectId);
  if (error) return fail(error);

  if (!name.trim()) return fail("アイデアのタイトルを入力してください。");
  if (Object.keys(components).length === 0) return fail("組み合わせが選択されていません。");

  const supabase = await getSupabase();

  const { data: existingSolutions } = await supabase
    .from("Solution")
    .select("components")
    .eq("projectId", projectId);

  if (existingSolutions?.some((sol) => isSameComponents(components, sol.components))) {
    return fail("この組み合わせはすでに保存されています。別の組み合わせを試してみましょう。");
  }

  const payload = { projectId, name: name.trim(), description: description.trim(), components };

  // Solution.authorId は migration_v2 で追加される列。
  // 未適用の環境では列不足エラー(42703)になるので、その場合は著者なしで保存する。
  let insertError = (await supabase.from("Solution").insert({ ...payload, authorId: profile!.id })).error;
  if (insertError?.code === "42703") {
    insertError = (await supabase.from("Solution").insert(payload)).error;
  }
  if (insertError) return fail("解決策の保存に失敗しました。");

  await bumpActivity(profile!.id);
  const unlocked = await unlockAchievements(profile!.id, profile!.userId, "SOLUTION");

  await notifyProjectMembers({
    projectId,
    actorProfileId: profile!.id,
    title: "新しい解決策",
    content: `${profile!.username} さんが「${name.trim()}」を組み立てました`,
    link: stepPath(projectId, "step5"),
  });

  revalidateProject(projectId, "step5", "step6");
  return { success: true, unlocked };
}

export async function updateSolution(
  id: string,
  projectId: string,
  name: string,
  description: string
): Promise<ActionResult> {
  const { error } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { error: updateError } = await supabase
    .from("Solution")
    .update({ name: name.trim(), description: description.trim() })
    .eq("id", id);
  if (updateError) return fail("更新に失敗しました。");

  revalidateProject(projectId, "step5", "step6");
  return { success: true };
}

export async function deleteSolution(id: string, projectId: string): Promise<ActionResult> {
  const { error } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { error: deleteError } = await supabase.from("Solution").delete().eq("id", id);
  if (deleteError) return fail("削除に失敗しました。");

  revalidateProject(projectId, "step5", "step6");
  return { success: true };
}

/* ============================================================
 * STEP 6: 評価
 * ========================================================== */

export async function toggleEvaluation(
  solutionId: string,
  desireId: string,
  projectId: string
): Promise<ActionResult> {
  const { error, profile } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("Evaluation")
    .select("id")
    .eq("solutionId", solutionId)
    .eq("desireId", desireId)
    .maybeSingle();

  const result = existing
    ? await supabase.from("Evaluation").delete().eq("id", existing.id)
    : await supabase.from("Evaluation").insert({ solutionId, desireId, score: 1 });

  if (result.error) return fail("評価の更新に失敗しました。");

  await bumpActivity(profile!.id);
  revalidateProject(projectId, "step6");
  return { success: true };
}

/* ============================================================
 * 議論（チャット）
 * ========================================================== */

const STEP_LABELS: Record<string, string> = {
  step1: "STEP 1 課題候補",
  step2: "STEP 2 課題分解",
  step3: "STEP 3 要望分析",
  step4: "STEP 4 選択マップ",
  step5: "STEP 5 組み合わせ",
  step6: "STEP 6 評価",
};

/**
 * メッセージ投稿はサーバー経由にする。
 * ブラウザから直接 insert していた頃は、メンバーでない人でも書け、
 * かつ他のメンバーに何も通知が飛ばなかった。
 */
export async function postMessage(
  projectId: string,
  content: string,
  target: { candidateId?: string | null; step?: string | null; mindMapNodeId?: string | null }
): Promise<ActionResult> {
  const { error, profile } = await requireMember(projectId);
  if (error) return fail(error);

  const trimmed = content.trim();
  if (!trimmed) return fail("メッセージを入力してください。");

  const supabase = await getSupabase();
  const base: Record<string, any> = {
    projectId,
    content: trimmed,
    profileId: profile!.id,
    candidateId: target.candidateId ?? null,
    mindMapNodeId: target.mindMapNodeId ?? null,
  };

  // Message.step は migration_v2 で追加される列。未適用でも投稿は通す。
  let insertError = (await supabase.from("Message").insert({ ...base, step: target.step ?? null })).error;
  if (insertError?.code === "42703") {
    insertError = (await supabase.from("Message").insert(base)).error;
  }
  if (insertError) return fail("メッセージの送信に失敗しました。");

  const where = target.candidateId
    ? "課題候補"
    : target.step
      ? STEP_LABELS[target.step] ?? "プロジェクト"
      : "プロジェクト";

  await notifyProjectMembers({
    projectId,
    actorProfileId: profile!.id,
    title: `${where}に新しいコメント`,
    content: `${profile!.username}: ${trimmed.slice(0, 80)}`,
    link: target.candidateId
      ? stepPath(projectId, "step1")
      : stepPath(projectId, target.step ?? "step2"),
  });

  return { success: true };
}

export async function deleteMessage(messageId: string, projectId: string): Promise<ActionResult> {
  const { error, profile, role } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { data: message } = await supabase.from("Message").select("profileId").eq("id", messageId).single();
  if (!message) return fail("対象が見つかりません。");
  if (String(message.profileId) !== String(profile!.id) && role !== "owner") {
    return fail("削除できるのは投稿者本人（またはオーナー）だけです。");
  }

  const { error: deleteError } = await supabase.from("Message").delete().eq("id", messageId);
  if (deleteError) return fail("削除に失敗しました。");

  return { success: true };
}

/* ============================================================
 * メンバー管理
 * ========================================================== */

export async function searchUsers(query: string) {
  if (!query || query.trim().length < 2) return [];
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("Profile")
    .select("id, username, avatarUrl")
    .ilike("username", `%${query.trim()}%`)
    .limit(8);
  return data || [];
}

export async function addMember(projectId: string, profileId: string): Promise<ActionResult> {
  const { error, profile } = await requireMember(projectId);
  if (error) return fail(error);

  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("ProjectMember")
    .select("id")
    .eq("projectId", projectId)
    .eq("profileId", profileId)
    .maybeSingle();

  if (existing) return fail("すでにメンバーです。");

  const { error: insertError } = await supabase
    .from("ProjectMember")
    .insert({ projectId, profileId, role: "member" });
  if (insertError) return fail("メンバーの追加に失敗しました。");

  await notifyProjectMembers({
    projectId,
    actorProfileId: profile!.id,
    title: "新しいメンバー",
    content: `${profile!.username} さんがメンバーを追加しました`,
    link: stepPath(projectId, "members"),
  });

  revalidatePath(stepPath(projectId, "members"));
  return { success: true };
}

/* ============================================================
 * プロフィール（貢献グラフ）
 * ========================================================== */

export async function getContributionData(profileId: string) {
  const supabase = await getSupabase();

  const { data: profile } = await supabase.from("Profile").select("userId").eq("id", profileId).single();
  if (!profile) return {};

  const results = await Promise.all([
    supabase.from("Candidate").select("createdAt").eq("authorId", profile.userId),
    supabase.from("SubProblem").select("createdAt").eq("authorId", profileId),
    supabase.from("Desire").select("createdAt").eq("authorId", profileId),
    supabase.from("Choice").select("createdAt").eq("authorId", profileId),
    supabase.from("Solution").select("createdAt").eq("authorId", profileId),
  ]);

  const map: Record<string, number> = {};
  const collect = (items: any[] | null, score: number) => {
    (items || []).forEach((item) => {
      const date = new Date(item.createdAt).toISOString().split("T")[0];
      map[date] = Math.max(map[date] || 0, score);
    });
  };

  collect(results[0].data, 2);
  collect(results[1].data, 3);
  collect(results[2].data, 3);
  collect(results[3].data, 4);
  collect(results[4].data, 5); // Solution.authorId 未追加の環境では data が null になるだけ

  return map;
}

/* ============================================================
 * マインドマップ
 * ========================================================== */

export async function createMindMapNode(
  projectId: string,
  scope: "team" | "personal",
  label: string,
  x: number,
  y: number
) {
  const { error, profile } = await requireMember(projectId);
  if (error) return null;

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("MindMapNode")
    .insert({
      projectId: Number(projectId),
      scope,
      label,
      positionX: x,
      positionY: y,
      authorId: profile!.id,
    })
    .select()
    .single();

  revalidatePath(stepPath(projectId, "mindmap"));
  return data;
}

export async function updateMindMapNodePosition(id: string, projectId: string, x: number, y: number) {
  const supabase = await getSupabase();
  await supabase
    .from("MindMapNode")
    .update({ positionX: x, positionY: y, updatedAt: new Date().toISOString() })
    .eq("id", id);
}

export async function updateMindMapNodeLabel(id: string, projectId: string, label: string) {
  const supabase = await getSupabase();
  await supabase.from("MindMapNode").update({ label, updatedAt: new Date().toISOString() }).eq("id", id);
  revalidatePath(stepPath(projectId, "mindmap"));
}

export async function deleteMindMapNode(id: string, projectId: string) {
  const supabase = await getSupabase();
  await supabase.from("MindMapNode").delete().eq("id", id);
  revalidatePath(stepPath(projectId, "mindmap"));
}

export async function createMindMapEdge(
  projectId: string,
  scope: "team" | "personal",
  sourceId: string,
  targetId: string,
  sourceHandle?: string | null,
  targetHandle?: string | null
) {
  const { error, profile } = await requireMember(projectId);
  if (error) return;

  const supabase = await getSupabase();
  await supabase.from("MindMapEdge").insert({
    projectId: Number(projectId),
    scope,
    sourceId,
    targetId,
    sourceHandle,
    targetHandle,
    authorId: profile!.id,
  });
  revalidatePath(stepPath(projectId, "mindmap"));
}

export async function deleteMindMapEdge(id: string, projectId: string) {
  const supabase = await getSupabase();
  await supabase.from("MindMapEdge").delete().eq("id", id);
  revalidatePath(stepPath(projectId, "mindmap"));
}
