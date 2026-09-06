"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaKey,
  FaLock,
  FaPlug,
  FaShieldAlt,
  FaTrash,
} from "react-icons/fa";
import { cn } from "@/lib/utils";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { useAction } from "@/components/ui/useAction";
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from "@/lib/ai/providers";
import type { AiStatus } from "@/lib/ai/client";
import { connectProvider, disconnectProvider, selectProvider } from "./actions";

export function SettingsClient({ status }: { status: AiStatus }) {
  const [openProvider, setOpenProvider] = useState<ProviderId | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const { run, isBusy } = useAction();

  const connectedMap = new Map(status.connected.map((c) => [c.provider, c]));

  const startEdit = (id: ProviderId) => {
    setOpenProvider(id);
    setApiKey("");
    setModel(connectedMap.get(id)?.model ?? PROVIDERS[id].defaultModel);
  };

  return (
    <div className="max-w-3xl mx-auto p-2 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[var(--ink-2)] hover:text-[var(--accent)] font-bold text-sm"
      >
        <FaArrowLeft /> ホームに戻る
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <FaPlug className="text-[var(--accent)]" /> AI接続
        </h1>
        <p className="text-sm text-[var(--ink-2)] leading-relaxed">
          ご自身が契約している AI の APIキーを登録すると、課題出し・分解・要望の洗い出し・事例探しを
          手伝ってもらえるようになります。キーは<span className="font-bold">あなた専用</span>で、
          他のメンバーには共有されません。
        </p>
      </header>

      {/* 誤解しやすい点を先に明示する */}
      <div className="panel p-4 space-y-2 text-xs text-[var(--ink-2)] leading-relaxed">
        <p className="font-bold text-[var(--ink)] flex items-center gap-2">
          <FaKey className="text-[var(--ink-3)]" /> はじめに
        </p>
        <p>
          ChatGPT Plus / Claude Pro / Gemini Advanced などの<span className="font-bold">月額プランは、外部アプリから接続できません</span>
          （各社ともサブスク契約を third-party に連携する仕組みを公開していません）。
          利用には各社の開発者コンソールで発行する <span className="font-bold">APIキー（従量課金）</span>が必要です。
        </p>
        <p>
          Google AI Studio には無料枠があるので、まず試すなら Gemini が手軽です。
        </p>
      </div>

      {!status.encryptionReady && (
        <div className="border-2 border-[var(--danger)] bg-[var(--danger-soft)] p-4 text-sm space-y-1">
          <p className="font-bold text-[var(--danger)] flex items-center gap-2">
            <FaShieldAlt /> サーバー側の設定が未完了です
          </p>
          <p className="text-[var(--ink-2)] text-xs leading-relaxed">
            環境変数 <code className="font-mono bg-white px-1">AI_CREDENTIAL_SECRET</code> が設定されていないため、
            APIキーを暗号化して保存できません。32文字以上のランダム文字列を設定してから再度お試しください。
          </p>
        </div>
      )}

      <div className="space-y-4">
        {PROVIDER_IDS.map((id) => {
          const meta = PROVIDERS[id];
          const connected = connectedMap.get(id);
          const isActive = status.activeProvider === id;
          const isOpen = openProvider === id;

          return (
            <section
              key={id}
              className={cn(
                "card p-5 space-y-4 transition-colors",
                isActive && "border-[var(--accent)] border-2"
              )}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <h2 className="font-bold flex items-center gap-2">
                    {meta.label}
                    {connected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--ok)] bg-[var(--ok-soft)] border border-[var(--ok-line)] px-2 py-0.5 rounded">
                        <FaCheckCircle /> 接続済み
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-bold text-white bg-[var(--accent)] px-2 py-0.5 rounded">
                        使用中
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-[var(--ink-2)] mt-1">{meta.note}</p>
                  {connected && (
                    <p className="text-[11px] text-[var(--ink-3)] mt-1 font-mono">モデル: {connected.model}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {connected && !isActive && (
                    <PixelButton
                      size="sm"
                      variant="secondary"
                      onClick={() => run(() => selectProvider(id), { key: "use-" + id, success: "使用するAIを切り替えました" })}
                      loading={isBusy("use-" + id)}
                    >
                      これを使う
                    </PixelButton>
                  )}
                  <PixelButton size="sm" variant={connected ? "ghost" : "secondary"} onClick={() => (isOpen ? setOpenProvider(null) : startEdit(id))}>
                    {connected ? "キーを更新" : "接続する"}
                  </PixelButton>
                  {connected && (
                    <button
                      onClick={() =>
                        run(() => disconnectProvider(id), {
                          key: "del-" + id,
                          confirm: {
                            title: meta.label + " の接続を解除しますか？",
                            message: "保存されているAPIキーを削除します。",
                            confirmLabel: "解除する",
                            tone: "danger",
                          },
                          success: "接続を解除しました",
                        })
                      }
                      className="p-2 text-[var(--ink-3)] hover:text-[var(--danger)]"
                      title="接続を解除"
                    >
                      <FaTrash size={12} />
                    </button>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="animate-rise space-y-3 pt-3 border-t border-[var(--line)]">
                  <a
                    href={meta.consoleUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent-ink)] hover:underline"
                  >
                    {meta.consoleLabel} でキーを発行 <FaExternalLinkAlt size={9} />
                  </a>

                  <PixelInput
                    label="APIキー"
                    type="password"
                    autoComplete="off"
                    placeholder={meta.keyPlaceholder}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    hint="保存前に一度だけ実際に接続して、動くキーかどうか確認します。"
                  />

                  <div className="space-y-1.5">
                    <label className="font-bold text-xs text-[var(--ink-2)]">モデル</label>
                    <input
                      list={"models-" + id}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={meta.defaultModel}
                      className="w-full bg-white border-2 border-[var(--line-strong)] rounded-[3px] px-3 py-2.5 text-sm font-mono focus:outline-none focus:bg-[var(--accent-soft)]"
                    />
                    <datalist id={"models-" + id}>
                      {meta.modelOptions.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                    <p className="text-[11px] text-[var(--ink-3)]">
                      候補から選ぶか、直接入力できます。新しいモデルが出たらここを書き換えてください。
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <PixelButton size="sm" variant="ghost" onClick={() => setOpenProvider(null)}>
                      キャンセル
                    </PixelButton>
                    <PixelButton
                      size="sm"
                      disabled={!apiKey.trim() || !status.encryptionReady}
                      loading={isBusy("connect-" + id)}
                      onClick={() =>
                        run(
                          async () => {
                            const res = await connectProvider(id, apiKey, model);
                            if (!res.error) {
                              setApiKey("");
                              setOpenProvider(null);
                            }
                            return res;
                          },
                          { key: "connect-" + id, success: "接続しました" }
                        )
                      }
                    >
                      <FaLock /> 接続テストして保存
                    </PixelButton>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="panel p-4 text-xs text-[var(--ink-2)] leading-relaxed space-y-1">
        <p className="font-bold text-[var(--ink)] flex items-center gap-2">
          <FaShieldAlt className="text-[var(--ink-3)]" /> キーの扱い
        </p>
        <p>
          APIキーは AES-256-GCM で暗号化してから保存します。復号できるのはサーバーの環境変数を持つこのアプリだけで、
          データベースを直接見ても中身は読めません。行レベルのアクセス制御も設定してあるため、他のユーザーからは参照できません。
        </p>
        <p>AIへの送信内容は、そのプロジェクトの課題・サブ課題・望み・事例と、あなたが入力した文章です。</p>
      </div>
    </div>
  );
}
