import { NextResponse } from "next/server";
import { getProfile, getProjectMembership, getSupabase } from "@/lib/auth";
import { getProjectSnapshot } from "@/lib/project";
import { AiNotConnectedError, streamAi } from "@/lib/ai/client";
import { buildCoachSystemPrompt, buildProjectContext } from "@/lib/ai/prompts";

/**
 * AI コーチとの壁打ち（ストリーミング）。
 *
 * server action ではなく route handler にしているのは、
 * 応答を一文字ずつ返したいから。まとめて返ってくるより
 * 「一緒に考えている」感が段違いに強く、壁打ちが続く。
 */

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const projectId = String(body?.projectId ?? "");
  const step = String(body?.step ?? "step1");
  const message = String(body?.message ?? "").trim();

  if (!projectId || !message) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  const [profile, membership] = await Promise.all([getProfile(), getProjectMembership(projectId)]);
  if (!profile) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  if (!membership) return NextResponse.json({ error: "権限がありません。" }, { status: 403 });

  const supabase = await getSupabase();

  // 直近のやり取りを文脈として渡す（長くなりすぎないよう 16 往復まで）
  const { data: history } = await supabase
    .from("CoachMessage")
    .select("role, content")
    .eq("projectId", projectId)
    .eq("profileId", profile.id)
    .eq("step", step)
    .order("createdAt", { ascending: false })
    .limit(16);

  const priorTurns = (history || [])
    .reverse()
    .map((m: any) => ({ role: m.role === "assistant" ? ("assistant" as const) : ("user" as const), content: m.content }));

  const snapshot = await getProjectSnapshot(projectId);
  const system = buildCoachSystemPrompt(step, buildProjectContext(snapshot), profile.username);

  let iterator: AsyncGenerator<string>;
  try {
    iterator = await streamAi({
      system,
      messages: [...priorTurns, { role: "user", content: message }],
      maxTokens: 900,
      temperature: 0.9,
    });
  } catch (e: any) {
    const status = e instanceof AiNotConnectedError ? 428 : 502;
    return NextResponse.json({ error: e?.message || "AIの呼び出しに失敗しました。" }, { status });
  }

  // 送信したユーザー発言は先に残す（途中で切れても会話が消えないように）
  await supabase.from("CoachMessage").insert({
    projectId,
    profileId: profile.id,
    step,
    role: "user",
    content: message,
  });

  const encoder = new TextEncoder();
  let answer = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) {
          if (answer.trim()) {
            await supabase.from("CoachMessage").insert({
              projectId,
              profileId: profile.id,
              step,
              role: "assistant",
              content: answer,
            });
          }
          controller.close();
          return;
        }
        answer += value;
        controller.enqueue(encoder.encode(value));
      } catch (e: any) {
        controller.enqueue(encoder.encode("\n\n[エラー] " + (e?.message || "応答が中断されました。")));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
