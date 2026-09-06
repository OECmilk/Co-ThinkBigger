"use server";

import { revalidatePath } from "next/cache";
import { getProfile, getSupabase } from "@/lib/auth";
import { encryptSecret, isEncryptionConfigured } from "@/lib/ai/crypto";
import { PROVIDERS, generate, isProviderId, type ProviderId } from "@/lib/ai/providers";

export type SettingsResult = { error?: string; success?: true; message?: string };

/**
 * API キーの登録。
 *
 * 受け取ったキーは即座に暗号化して保存し、平文はどこにも残さない。
 * 保存前に実際に 1 回叩いて、動くキーであることを確かめてから入れる
 * （動かないキーを保存すると、後で「AIが反応しない」の原因究明が難しくなる）。
 */
export async function connectProvider(
  providerRaw: string,
  apiKey: string,
  model: string
): Promise<SettingsResult> {
  const profile = await getProfile();
  if (!profile) return { error: "ログインが必要です。" };

  if (!isEncryptionConfigured()) {
    return {
      error:
        "サーバーに AI_CREDENTIAL_SECRET が設定されていないため、APIキーを安全に保存できません。環境変数を設定してください。",
    };
  }

  if (!isProviderId(providerRaw)) return { error: "対応していないプロバイダです。" };
  const provider: ProviderId = providerRaw;

  const key = apiKey.trim();
  if (!key) return { error: "APIキーを入力してください。" };

  const chosenModel = model.trim() || PROVIDERS[provider].defaultModel;

  try {
    await generate(provider, key, chosenModel, {
      system: "接続確認です。",
      messages: [{ role: "user", content: "OKとだけ返してください。" }],
      maxTokens: 16,
      temperature: 0,
    });
  } catch (e: any) {
    return { error: e?.message || "接続を確認できませんでした。キーとモデル名をご確認ください。" };
  }

  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("AiCredential")
    .select("id")
    .eq("profileId", profile.id)
    .eq("provider", provider)
    .maybeSingle();

  const payload = {
    profileId: profile.id,
    provider,
    encryptedKey: encryptSecret(key),
    model: chosenModel,
    updatedAt: new Date().toISOString(),
  };

  const result = existing
    ? await supabase.from("AiCredential").update(payload).eq("id", existing.id)
    : await supabase.from("AiCredential").insert(payload);

  if (result.error) {
    return {
      error:
        "保存に失敗しました。migration_v3_ai.sql を実行済みかご確認ください。（" +
        result.error.message +
        "）",
    };
  }

  // 初回接続はそのまま使うプロバイダにする
  await supabase.from("Profile").update({ aiProvider: provider }).eq("id", profile.id);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true, message: PROVIDERS[provider].label + " に接続しました。" };
}

export async function selectProvider(providerRaw: string): Promise<SettingsResult> {
  const profile = await getProfile();
  if (!profile) return { error: "ログインが必要です。" };
  if (!isProviderId(providerRaw)) return { error: "対応していないプロバイダです。" };

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("Profile")
    .update({ aiProvider: providerRaw })
    .eq("id", profile.id);

  if (error) return { error: "切り替えに失敗しました。" };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function disconnectProvider(providerRaw: string): Promise<SettingsResult> {
  const profile = await getProfile();
  if (!profile) return { error: "ログインが必要です。" };
  if (!isProviderId(providerRaw)) return { error: "対応していないプロバイダです。" };

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("AiCredential")
    .delete()
    .eq("profileId", profile.id)
    .eq("provider", providerRaw);

  if (error) return { error: "解除に失敗しました。" };

  revalidatePath("/dashboard/settings");
  return { success: true, message: "接続を解除しました。" };
}
