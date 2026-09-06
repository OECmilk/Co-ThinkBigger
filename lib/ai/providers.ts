/**
 * AI プロバイダの差を吸収する薄い層。
 *
 * ユーザーは自分が契約している所（Anthropic / OpenAI / Google）の API キーを登録し、
 * アプリ側はどこに繋いでいるかを意識せずに generate / streamGenerate を呼ぶ。
 *
 * 依存を増やさないため、各社の SDK は使わず REST を直接叩いている。
 */

export type ProviderId = "anthropic" | "openai" | "gemini";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type GenerateInput = {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
};

export type ProviderMeta = {
  id: ProviderId;
  label: string;
  consoleUrl: string;
  consoleLabel: string;
  keyPlaceholder: string;
  defaultModel: string;
  /** 画面で候補として出すモデル。ここに無いものも自由入力できる。 */
  modelOptions: string[];
  note: string;
};

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  anthropic: {
    id: "anthropic",
    label: "Claude (Anthropic)",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    consoleLabel: "Anthropic Console",
    keyPlaceholder: "sk-ant-api03-...",
    defaultModel: "claude-sonnet-5",
    modelOptions: ["claude-sonnet-5", "claude-opus-5", "claude-haiku-4-5-20251001"],
    note: "Claude Pro / Max の月額とは別に、API の従量課金が必要です。",
  },
  openai: {
    id: "openai",
    label: "GPT (OpenAI)",
    consoleUrl: "https://platform.openai.com/api-keys",
    consoleLabel: "OpenAI Platform",
    keyPlaceholder: "sk-proj-...",
    defaultModel: "gpt-4o-mini",
    modelOptions: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
    note: "ChatGPT Plus の月額とは別に、API の従量課金が必要です。",
  },
  gemini: {
    id: "gemini",
    label: "Gemini (Google)",
    consoleUrl: "https://aistudio.google.com/apikey",
    consoleLabel: "Google AI Studio",
    keyPlaceholder: "AIza...",
    defaultModel: "gemini-2.0-flash",
    modelOptions: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"],
    note: "Google AI Studio で無料枠つきのキーを発行できます。",
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as string[]).includes(value);
}

/* ============================================================
 * リクエスト組み立て
 * ========================================================== */

type BuiltRequest = { url: string; init: RequestInit };

function buildRequest(
  provider: ProviderId,
  apiKey: string,
  model: string,
  input: GenerateInput,
  stream: boolean
): BuiltRequest {
  const maxTokens = input.maxTokens ?? 1500;
  const temperature = input.temperature ?? 0.9;

  if (provider === "anthropic") {
    return {
      url: "https://api.anthropic.com/v1/messages",
      init: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system: input.system,
          messages: input.messages,
          ...(stream ? { stream: true } : {}),
        }),
      },
    };
  }

  if (provider === "openai") {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      init: {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + apiKey },
        body: JSON.stringify({
          model,
          max_completion_tokens: maxTokens,
          temperature,
          messages: [{ role: "system", content: input.system }, ...input.messages],
          ...(stream ? { stream: true } : {}),
        }),
      },
    };
  }

  // gemini
  const action = stream ? "streamGenerateContent?alt=sse&key=" : "generateContent?key=";
  const base = "https://generativelanguage.googleapis.com/v1beta/models/";
  return {
    url: base + encodeURIComponent(model) + ":" + action + encodeURIComponent(apiKey),
    init: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: input.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    },
  };
}

/** 各社のエラー本文から、ユーザーに見せられる一行を作る */
async function readError(res: Response): Promise<string> {
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.error?.message || body?.error?.[0]?.message || body?.message || "";
  } catch {
    /* JSON でない場合は無視 */
  }

  if (res.status === 401 || res.status === 403) {
    return "APIキーが無効か、権限がありません。設定画面から登録し直してください。";
  }
  if (res.status === 429) {
    return "APIのレート制限か残高不足です。しばらく待つか、契約状況を確認してください。";
  }
  if (res.status === 404) {
    return "モデル名が見つかりません。設定画面でモデルを確認してください。" + (detail ? "（" + detail + "）" : "");
  }
  return "AIの呼び出しに失敗しました（" + res.status + "）。" + detail;
}

/* ============================================================
 * 非ストリーム（構造化された提案を取るとき用）
 * ========================================================== */

export async function generate(
  provider: ProviderId,
  apiKey: string,
  model: string,
  input: GenerateInput
): Promise<string> {
  const { url, init } = buildRequest(provider, apiKey, model, input, false);
  const res = await fetch(url, { ...init, cache: "no-store" });

  if (!res.ok) throw new Error(await readError(res));

  const data = await res.json();

  if (provider === "anthropic") {
    return (data.content || []).map((c: any) => c.text || "").join("");
  }
  if (provider === "openai") {
    return data.choices?.[0]?.message?.content ?? "";
  }
  return (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
}

/* ============================================================
 * ストリーム（壁打ちチャット用）
 * ========================================================== */

/** SSE の "data:" 行だけを取り出す */
async function* sseLines(res: Response): AsyncGenerator<string> {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:")) yield trimmed.slice(5).trim();
    }
  }
}

/** 応答テキストを少しずつ返す */
export async function* streamGenerate(
  provider: ProviderId,
  apiKey: string,
  model: string,
  input: GenerateInput
): AsyncGenerator<string> {
  const { url, init } = buildRequest(provider, apiKey, model, input, true);
  const res = await fetch(url, { ...init, cache: "no-store" });

  if (!res.ok) throw new Error(await readError(res));

  for await (const payload of sseLines(res)) {
    if (!payload || payload === "[DONE]") continue;

    let json: any;
    try {
      json = JSON.parse(payload);
    } catch {
      continue;
    }

    if (provider === "anthropic") {
      if (json.type === "content_block_delta" && json.delta?.text) yield json.delta.text;
    } else if (provider === "openai") {
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    } else {
      const parts = json.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        const text = parts.map((p: any) => p.text || "").join("");
        if (text) yield text;
      }
    }
  }
}

/* ============================================================
 * JSON 応答の取り出し
 * ========================================================== */

/**
 * モデルは前置き付きで JSON を返してくることがあるので、
 * コードフェンスや前後の文章を許容して配列だけを取り出す。
 */
export function extractJsonArray(text: string): any[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();

  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];

  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
