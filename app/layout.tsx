import './globals.css';
import type { Metadata, Viewport } from 'next';
import { DotGothic16, Zen_Kaku_Gothic_New } from 'next/font/google';

/**
 * 見出し＝ドット絵フォント、本文＝可読性の高いゴシック、という 2 本立て。
 * 以前は全文字が DotGothic16 で、長い日本語の説明が読みづらく、
 * 「開いても頭に入ってこない」状態だった。
 */
const display = DotGothic16({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const body = Zen_Kaku_Gothic_New({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: {
    default: 'CO-THINK BIGGER',
    template: '%s | CO-THINK BIGGER',
  },
  description:
    'シーナ・アイエンガー『THINK BIGGER』の6ステップを、離れたチームで最後までやり切るためのツール。AIと壁打ちしながら、毎日少しずつ前に進めます。',
};

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
