"use server";

import { getProfile, getProjectMembership, getSupabase } from "@/lib/auth";
import { getProjectProgress, getProjectSnapshot, type DesireType } from "@/lib/project";
import { AiNotConnectedError, runAi } from "@/lib/ai/client";
import { extractJsonArray } from "@/lib/ai/providers";
import {
  buildDailyNudgePrompt,
  buildProjectContext,
  buildSuggestionPrompt,
  type SuggestionTask,
} from "@/lib/ai/prompts";
import { fetchTopics, TOPIC_PRESETS } from "@/lib/news";
import { addCandidate, addChoice, addDesire, addSubProblem, setMainProblem } from "./actions";

/**
 * AI に「考えてもらう」側の入り口。
 *
 * 方針として、AI の出力を直接データに書き込むことはしない。
 * 必ず「候補」として画面に出し、利用者が選んだものだけが
 * 本人の下書きとして保存される。
 * THINK BIGGER は本人が選ぶ過程そのものに意味があるので、
 * ここを自動化すると手法として成立しなくなる。
 */

export type Suggestion = {
  text: string;
  why?: string;
  domain?: string;
};

export type SuggestResult = { error?: string; suggestions?: Suggestion[] };

async function requireMember(projectId: string) {
  const [profile, membership] = await Promise.all([getProfile(), getProjectMembership(projectId)]);
  if (!profile) return { error: "ログインが必要です。", profile: null };
  if (!membership) return { error: "このプロジェクトのメンバーではありません。", profile: null };
  return { error: null, profile };
}

function toSuggestions(raw: any[]): Suggestion[] {
  return raw
    .map((r) => ({
      text: String(r?.text ?? "").trim(),
      why: r?.why ? String(r.why).trim() : undefined,
      domain: r?.domain ? String(r.domain).trim() : undefined,
    }))
    .filter((s) => s.text.length > 0)
    .slice(0, 8);
}

/* ============================================================
 * 提案の生成
 * ========================================================== */

export type SuggestRequest =
  | { kind: "candidates"; hint?: string; topicPreset?: string }
  | { kind: "subProblems" }
  | { kind: "desires"; desireType: DesireType }
  | { kind: "choices"; subProblemId: string; wantOutside: boolean }
  | { kind: "reframe" };

export async function suggest(projectId: string, request: SuggestRequest): Promise<SuggestResult> {
  const { error } = await requireMember(projectId);
  if (error) return { error };

  const snapshot = await getProjectSnapshot(projectId);
  const context = buildProjectContext(snapshot);

  let task: SuggestionTask;

  if (request.kind === "choices") {
    const sub = snapshot.subProblems.find((s) => s.id === String(request.subProblemId));
    if (!sub) return { error: "対象のサブ課題が見つかりません。" };
    task = { kind: "choices", subProblemTitle: sub.title, wantOutside: request.wantOutside };
  } else if (request.kind === "candidates") {
    // ニュースを種にする場合はここで取り込む
    let topics: string[] | undefined;
    if (request.topicPreset) {
      const preset = TOPIC_PRESETS.find((p) => p.id === request.topicPreset);
      if (preset) {
        const items = await fetchTopics(preset.query, 10);
        topics = items.map((t) => t.title);
      }
    }
    task = { kind: "candidates", hint: request.hint, topics };
  } else if (request.kind === "desires") {
    task = { kind: "desires", desireType: request.desireType };
  } else if (request.kind === "subProblems") {
    task = { kind: "subProblems" };
  } else {
    task = { kind: "reframe" };
  }

  const prompt = buildSuggestionPrompt(task, context);

  try {
    const text = await runAi({
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
      temperature: prompt.temperature,
      maxTokens: 1600,
    });

    const suggestions = toSuggestions(extractJsonArray(text));
    if (suggestions.length === 0) {
      return { error: "AIの返答をうまく読み取れませんでした。もう一度お試しください。" };
    }
    return { suggestions };
  } catch (e: any) {
    if (e instanceof AiNotConnectedError) return { error: e.message };
    return { error: e?.message || "AIの呼び出しに失敗しました。" };
  }
}

/* ============================================================
 * 提案の採用（選んだものだけを自分の下書きにする）
 * ========================================================== */

export type AdoptRequest =
  | { kind: "candidates"; texts: string[] }
  | { kind: "subProblems"; texts: string[] }
  | { kind: "desires"; desireType: DesireType; texts: string[] }
  | { kind: "choices"; subProblemId: string; items: { text: string; isOutsideDomain: boolean }[] }
  | { kind: "reframe"; text: string };

export async function adopt(
  projectId: string,
  request: AdoptRequest
): Promise<{ error?: string; success?: true; added?: number }> {
  const { error } = await requireMember(projectId);
  if (error) return { error };

  try {
    if (request.kind === "reframe") {
      const res = await setMainProblem(projectId, request.text);
      return res.error ? { error: res.error } : { success: true, added: 1 };
    }

    if (request.kind === "choices") {
      for (const item of request.items) {
        const res = await addChoice(request.subProblemId, projectId, item.text, item.isOutsideDomain);
        if (res.error) return { error: res.error };
      }
      return { success: true, added: request.items.length };
    }

    for (const text of request.texts) {
      const res =
        request.kind === "candidates"
          ? await addCandidate(projectId, text)
          : request.kind === "subProblems"
            ? await addSubProblem(projectId, text)
            : await addDesire(projectId, request.desireType, text);
      if (res.error) return { error: res.error };
    }

    return { success: true, added: request.texts.length };
  } catch (e: any) {
    return { error: e?.message || "追加に失敗しました。" };
  }
}

/* ============================================================
 * ニューストピック
 * ========================================================== */

export async function loadTopics(presetId: string, customQuery?: string) {
  const preset = TOPIC_PRESETS.find((p) => p.id === presetId);
  const query = customQuery?.trim() || preset?.query || "";
  return fetchTopics(query, 12);
}

/* ============================================================
 * 今日の一手（ホーム画面）
 * ========================================================== */

export async function getDailyNudge(projectId: string): Promise<{ text?: string; error?: string }> {
  const { error } = await requireMember(projectId);
  if (error) return { error };

  const [snapshot, progress] = await Promise.all([
    getProjectSnapshot(projectId),
    getProjectProgress(projectId),
  ]);

  const prompt = buildDailyNudgePrompt(
    buildProjectContext(snapshot, { includeAll: false }),
    progress.current.num + ". " + progress.current.label,
    progress.current.goal
  );

  try {
    const text = await runAi({
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
      temperature: prompt.temperature,
      maxTokens: 200,
    });
    return { text: text.trim() };
  } catch (e: any) {
    if (e instanceof AiNotConnectedError) return { error: e.message };
    return { error: e?.message || "取得に失敗しました。" };
  }
}

/* ============================================================
 * 壁打ちログ（別デバイス・別の日でも続きから話せるように残す）
 * ========================================================== */

export type CoachTurn = { id: string; role: "user" | "assistant"; content: string; createdAt: string };

export async function loadCoachHistory(projectId: string, step: string): Promise<CoachTurn[]> {
  const { profile } = await requireMember(projectId);
  if (!profile) return [];

  const supabase = await getSupabase();

  const { data } = await supabase
    .from("CoachMessage")
    .select("id, role, content, createdAt")
    .eq("projectId", projectId)
    .eq("profileId", profile.id)
    .eq("step", step)
    .order("createdAt", { ascending: true })
    .limit(60);

  return (data || []).map((m: any) => ({
    id: String(m.id),
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }));
}

export async function clearCoachHistory(projectId: string, step: string) {
  const { profile } = await requireMember(projectId);
  if (!profile) return { error: "権限がありません。" };

  const supabase = await getSupabase();

  await supabase
    .from("CoachMessage")
    .delete()
    .eq("projectId", projectId)
    .eq("profileId", profile.id)
    .eq("step", step);

  return { success: true as const };
}

