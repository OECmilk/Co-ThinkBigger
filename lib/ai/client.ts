import { cache } from "react";
import { getProfile, getSupabase } from "@/lib/auth";
import { decryptSecret, isEncryptionConfigured } from "./crypto";
import {
  PROVIDERS,
  generate,
  isProviderId,
  streamGenerate,
  type ChatMessage,
  type GenerateInput,
  type ProviderId,
} from "./providers";

/**
 * ログイン中のユーザーの AI 接続を解決する。
 *
 * キーはユーザーごとなので「誰がどれだけ使うか」はその人の契約に閉じる。
 * アプリ側で共通キーを持たない＝運営コストが利用者数に比例しない、という狙いもある。
 */

export type AiConnection = {
  provider: ProviderId;
  model: string;
  apiKey: string;
};

/** UI に見せてよい範囲の接続状態 */
export type AiStatus = {
  configured: boolean;
  encryptionReady: boolean;
  activeProvider: ProviderId | null;
  connected: { provider: ProviderId; model: string }[];
};

export const getAiConnection = cache(async (): Promise<AiConnection | null> => {
  if (!isEncryptionConfigured()) return null;

  const profile = await getProfile();
  if (!profile) return null;

  const supabase = await getSupabase();

  const [{ data: rows }, { data: pref }] = await Promise.all([
    supabase
      .from("AiCredential")
      .select("provider, encryptedKey, model")
      .eq("profileId", profile.id),
    supabase.from("Profile").select("aiProvider").eq("id", profile.id).maybeSingle(),
  ]);

  if (!rows || rows.length === 0) return null;

  // 明示的に選ばれたプロバイダを優先し、無ければ登録済みの先頭
  const preferred = pref?.aiProvider;
  const row =
    (preferred && rows.find((r: any) => r.provider === preferred)) || rows[0];

  if (!row) return null;

  const provider = String(row.provider);
  if (!isProviderId(provider)) return null;

  try {
    return {
      provider,
      model: (row.model as string) || PROVIDERS[provider].defaultModel,
      apiKey: decryptSecret(row.encryptedKey),
    };
  } catch {
    // 暗号化鍵が変わった等で復号できない
    return null;
  }
});

export const getAiStatus = cache(async (): Promise<AiStatus> => {
  const encryptionReady = isEncryptionConfigured();
  const profile = await getProfile();

  if (!profile) {
    return { configured: false, encryptionReady, activeProvider: null, connected: [] };
  }

  const supabase = await getSupabase();
  const [{ data: rows }, { data: pref }] = await Promise.all([
    supabase.from("AiCredential").select("provider, model").eq("profileId", profile.id),
    supabase.from("Profile").select("aiProvider").eq("id", profile.id).maybeSingle(),
  ]);

  const connected = (rows || []).flatMap((r: any) => {
    const provider = String(r.provider);
    if (!isProviderId(provider)) return [];
    return [{ provider, model: (r.model as string) || PROVIDERS[provider].defaultModel }];
  });

  const activeProvider =
    (pref?.aiProvider && isProviderId(pref.aiProvider) ? pref.aiProvider : null) ??
    connected[0]?.provider ??
    null;

  return {
    configured: encryptionReady && connected.length > 0,
    encryptionReady,
    activeProvider,
    connected,
  };
});

/** AI 未接続を、呼び出し側が文言として扱える形にする */
export class AiNotConnectedError extends Error {
  constructor() {
    super("AIが未接続です。設定画面からご自身のAPIキーを登録してください。");
    this.name = "AiNotConnectedError";
  }
}

export async function runAi(input: GenerateInput): Promise<string> {
  const conn = await getAiConnection();
  if (!conn) throw new AiNotConnectedError();
  return generate(conn.provider, conn.apiKey, conn.model, input);
}

export async function streamAi(input: GenerateInput): Promise<AsyncGenerator<string>> {
  const conn = await getAiConnection();
  if (!conn) throw new AiNotConnectedError();
  return streamGenerate(conn.provider, conn.apiKey, conn.model, input);
}

export type { ChatMessage, GenerateInput, ProviderId };
