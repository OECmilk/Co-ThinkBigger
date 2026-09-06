# CO-THINK BIGGER

シーナ・アイエンガー『THINK BIGGER』の 6 ステップを、**離れたチームで最後までやり切る**ためのアプリ。

至上命題はこの 2 つだけです。

1. **挫折なく遂行する** — いつ開いても「今どこにいて、次に何をするか」が分かり、詰まっても手が止まらない
2. **離れたメンバーと難なく取り組める** — 誰が何をしたかが残り、非同期でも噛み合う

---

## ⚠️ セットアップ

### 1. DB マイグレーション

Supabase の SQL Editor で、**この順に**実行してください（どちらも冪等）。

| ファイル | 内容 |
|---|---|
| `migration_v2_collaboration.sql` | 共有・通知・リアルタイム・ステップ別スレッド |
| `migration_v3_ai.sql` | AI接続（APIキー保管）・壁打ちログ・連続日数 |

### 2. 環境変数

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=          # 招待リンクの生成に使用（本番URL）
AI_CREDENTIAL_SECRET=          # 32文字以上のランダム文字列。APIキーの暗号化に使う

# .env
DATABASE_URL=                  # Prisma 用（アプリ本体は Supabase クライアント経由）
DIRECT_URL=
```

`AI_CREDENTIAL_SECRET` の生成:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

> **この値は本番環境にも同じものを設定してください。**
> 値が変わると、保存済みの APIキーは復号できなくなり、各自の再登録が必要になります。

### 3. 起動

```bash
npm install
npm run dev
```

---

## AI アシスト（BYOK）

### 何ができるか

| 詰まりどころ | アプリ側の手当て |
|---|---|
| 課題候補が思いつかない | ニュースの見出しを眺める → 気になったものを「種」にして AI に候補を出させる |
| 課題分解が難しい | メイン課題を読ませて、独立した 4 つのサブ課題を提案させる |
| 要望分析が難しい | 自分 / ターゲット / 第三者、視点ごとに本音の望みを提案させる |
| 先行事例が出せない | サブ課題ごとに「**領域外**の事例」と「定番の事例」を別ボタンで探させる |
| 課題の問い直しが難しい | 抽象度を上げる・下げる・前提を疑う・主語を変える、の4角度でリフレーム案を出させる |
| そもそも一人だと進まない | どのステップからでも開ける **AIコーチ**（ストリーミング・ステップ別に会話保存） |

AI の出力は**そのままデータに書き込まれません**。必ず候補として並び、チェックしたものだけが
「自分の下書き」になります。選ぶ過程そのものが THINK BIGGER の核なので、そこは自動化していません。

### 接続方法

`/dashboard/settings` から、自分が契約しているところの APIキーを登録します。

> **重要**: ChatGPT Plus / Claude Pro / Gemini Advanced といった**月額プランは、外部アプリから接続できません**。
> 3社とも、サブスク契約を third-party アプリに委譲する仕組み（OAuth 連携）を公開していないためです。
> 利用には各社の開発者コンソールで発行する **APIキー（従量課金）**が必要になります。
> Google AI Studio には無料枠があるので、まず試すなら Gemini が手軽です。

| プロバイダ | キーの発行元 |
|---|---|
| Claude | [Anthropic Console](https://console.anthropic.com/settings/keys) |
| GPT | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Gemini | [Google AI Studio](https://aistudio.google.com/apikey) |

モデル名は設定画面で自由に変更できます（新モデルが出たら書き換えるだけ）。

### キーの扱い

- AES-256-GCM で暗号化して保存。復号鍵は `AI_CREDENTIAL_SECRET` を持つサーバーだけ
- `AiCredential` テーブルには **Row Level Security** を設定済み（本人の行しか読めない）
- 保存前に一度だけ実際に接続して、動くキーかを検証してから保存
- キーはユーザーごと。課金も利用量もその人の契約に閉じる

---

## 画面構成

```
ホーム (/dashboard)
  ├ 今日やること      … 次の一手 + その場で1行書ける入力欄 + AIの「今日の一手」
  ├ 連続日数          … 何日続いているか / 直近4週間の活動
  ├ チームの動き      … 誰が何を書いたかの時系列
  └ プロジェクト一覧   … 進捗バーと「次: 03 要望分析」

プロジェクト
  ├ 01 課題候補    課題を出し合い、1つをメイン課題に決める
  ├ 02 課題分解    メイン課題を3つ以上のサブ課題に分けて共有する
  ├ 03 要望分析    自分/ターゲット/第三者、3視点の望みを共有する
  ├ 04 選択マップ  各サブ課題に先行事例を集める（1つ以上は領域外から）
  ├ 05 組み合わせ  事例を1つずつ選び、解決策として保存する
  ├ 06 評価        3視点の充足度で採点し、本命を決める
  ├ マインドマップ
  └ メンバー       招待リンク / ユーザー検索

設定 (/dashboard/settings)  … AI接続
```

### 個人と共有の使い分け（重要）

THINK BIGGER の要は「**まず一人で考え、それから持ち寄る**」ことです。

- **自分の下書き** … 書いても他のメンバーには見えない
- **共有する** … チームの一覧に出る。**共有されたものだけが次のステップで使われる**

具体的には STEP 4 の行 = 共有サブ課題、STEP 5 の材料 = 共有事例、STEP 6 の評価軸 = 共有された望み。
共有は「取消」でいつでも戻せます。

---

## 主要なモジュール

| パス | 役割 |
|---|---|
| `lib/auth.ts` | 認証・プロフィール取得を React `cache()` でリクエスト単位にメモ化 |
| `lib/project.ts` | プロジェクト全状態のスナップショットと、6ステップの進捗モデル |
| `lib/streak.ts` | 連続日数（`ActivityDay` に1日1行で集計） |
| `lib/home.ts` | ホームの活動フィード |
| `lib/news.ts` | Google ニュース RSS（APIキー不要・30分キャッシュ） |
| `lib/ai/crypto.ts` | APIキーの暗号化（AES-256-GCM） |
| `lib/ai/providers.ts` | Anthropic / OpenAI / Gemini の差を吸収（SDK非依存・REST直叩き） |
| `lib/ai/client.ts` | ログイン中ユーザーの接続を解決して呼ぶ |
| `lib/ai/prompts.ts` | THINK BIGGER の作法を書き下したプロンプト集 |
| `components/ai/AiSuggest.tsx` | 「出してもらう→選ぶ→自分の下書きになる」共通UI |
| `components/ai/CoachDock.tsx` | 全ステップ共通の壁打ちパネル（ストリーミング） |
| `components/project/StepScaffold.tsx` | 各ステップの骨組み（ゴール表示・前提未達の案内・前後ナビ） |
| `components/ui/Feedback.tsx` / `useAction.ts` | トースト・確認ダイアログ・保留状態の共通化 |

すべての server action は例外を投げず `{ error }` を返す規約です（`useAction` がトーストに出します）。

---

## デザイン

- 見出しは `DotGothic16`、本文は `Zen Kaku Gothic New`。全文ドット絵フォントは日本語の長文が読みづらいため分離
- 色は `app/globals.css` の CSS変数（面 / 線 / 文字 / アクセント）に集約
- 枠線は `border` ベース。以前の `box-shadow` + `margin` 方式はレイアウトがズレる原因だったため置き換え済み

---

## 既知の課題

- **RLS は `AiCredential` にしか設定されていません。** 他のテーブルは匿名キーで読める状態です。
  マインドマップの「個人スコープ」もクライアント側フィルタ依存です。本番運用の前に全テーブルへの
  Row Level Security 設定が必要です。
- ダークモードは未対応。
- メール通知は未実装（アプリ内通知のみ）。
- `prisma/schema.prisma` は実 DB と乖離しています（実際の型は各 `*.sql` を参照）。
  アプリ本体は Prisma を使っていないため実害はありません。
