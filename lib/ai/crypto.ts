import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * ユーザーの API キーを保存するための暗号化。
 *
 * DB に平文で置くと、DB を覗ける人＝全員の API 課金を使える人、になってしまう。
 * AES-256-GCM で暗号化し、鍵はサーバーの環境変数だけが持つ。
 * （AiCredential テーブルには RLS も張ってあるので二重の防御になる）
 */

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.AI_CREDENTIAL_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AI_CREDENTIAL_SECRET が設定されていません。32文字以上のランダム文字列を環境変数に設定してください。"
    );
  }
  // 任意長の文字列から 32 バイトの鍵を作る
  return createHash("sha256").update(secret).digest();
}

export function isEncryptionConfigured(): boolean {
  const secret = process.env.AI_CREDENTIAL_SECRET;
  return !!secret && secret.length >= 16;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(payload: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(".");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("保存された認証情報の形式が不正です。再登録してください。");
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

/** 画面に出す用のマスク表示（sk-ant-...XyZ9） */
export function maskKey(key: string): string {
  if (key.length <= 12) return "•".repeat(key.length);
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}
