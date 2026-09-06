/**
 * 世の中のトピックを引いてくる。
 *
 * 「課題候補が思いつかない」の一番の原因は、机の前で自分の頭だけを探ることにある。
 * 外からネタを入れれば手が動くので、Google ニュースの公開 RSS を読む。
 * （APIキー不要・登録不要。取得結果は 30 分キャッシュする）
 */

export type Topic = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
};

/** ホーム/STEP1 で最初に見せる切り口 */
export const TOPIC_PRESETS = [
  { id: "trend", label: "いま話題", query: "" },
  { id: "social", label: "社会課題", query: "社会課題 OR 少子化 OR 地域 OR 格差" },
  { id: "tech", label: "テクノロジー", query: "AI OR テクノロジー OR スタートアップ" },
  { id: "work", label: "働き方", query: "働き方 OR 人手不足 OR 職場" },
  { id: "life", label: "暮らし", query: "生活 OR 子育て OR 介護 OR 健康" },
  { id: "env", label: "環境・エネルギー", query: "環境 OR 脱炭素 OR エネルギー" },
] as const;

export type TopicPresetId = (typeof TOPIC_PRESETS)[number]["id"];

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function pick(block: string, tag: string): string {
  const match = block.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">"));
  return match ? decodeEntities(match[1]) : "";
}

export async function fetchTopics(query: string, limit = 12): Promise<Topic[]> {
  const base = "https://news.google.com/rss";
  const url = query.trim()
    ? base + "/search?q=" + encodeURIComponent(query) + "&hl=ja&gl=JP&ceid=JP:ja"
    : base + "?hl=ja&gl=JP&ceid=JP:ja";

  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; CoThinkBigger/1.0)" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

    return items.slice(0, limit).map((block) => {
      const rawTitle = pick(block, "title");
      const source = pick(block, "source");
      // Google ニュースの title は「見出し - 媒体名」の形なので媒体名を落とす
      const title = source && rawTitle.endsWith(" - " + source)
        ? rawTitle.slice(0, -(source.length + 3))
        : rawTitle;

      return {
        title,
        link: pick(block, "link"),
        source: source || "ニュース",
        publishedAt: pick(block, "pubDate"),
      };
    });
  } catch {
    // 外部サービスなので落ちても機能全体は止めない
    return [];
  }
}
