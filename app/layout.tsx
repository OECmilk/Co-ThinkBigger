import './globals.css';
import type { Metadata } from 'next';
import { DotGothic16 } from 'next/font/google';

const dotGothic = DotGothic16({
  weight: '400',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Co-Think Bigger',
  description: 'シーナアイエンガーの名著「THINK BIGGER」を完遂するためのWEBアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${dotGothic.className} bg-stone-100 text-stone-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}
