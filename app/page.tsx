"use client";

import React from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaLightbulb, FaUsers, FaChartLine } from "react-icons/fa";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-12 bg-grid-pattern">
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-12">
        <h1 className="text-2xl font-bold tracking-widest text-[#f97316]">
          <span className="text-stone-800">CO-</span>THINK BIGGER
        </h1>
        <div className="flex gap-4">
          <Link href="/login">
            <PixelButton variant="secondary">ログイン</PixelButton>
          </Link>
          <Link href="/signup">
            <PixelButton>新規登録</PixelButton>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold leading-tight"
        >
          非同期で<br />
          <span className="text-[#f97316]">斬新なアイデア</span>を<br />
          生み出そう
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-stone-600 text-lg md:text-xl"
        >
          シーナ・アイエンガーの思考法をデジタルで実践。<br />
          場所や時間にとらわれず、チームで最高の解決策を。
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-8"
        >
          <Link href="/signup">
            <PixelButton className="text-xl px-12 py-4">
              今すぐ始める
            </PixelButton>
          </Link>
        </motion.div>
      </section>

      {/* Features Preview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-16">
        <PixelCard title="STEP 1" className="h-full">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="bg-stone-100 p-4 rounded-full pixel-border-sm">
              <FaLightbulb className="text-3xl text-[#f97316]" />
            </div>
            <h3 className="text-xl font-bold">課題発見</h3>
            <p className="text-stone-500 text-sm">
              チームで課題を出し合い、<br />
              リアクションで評価。
            </p>
          </div>
        </PixelCard>

        <PixelCard title="STEP 2" className="h-full">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="bg-stone-100 p-4 rounded-full pixel-border-sm">
              <FaUsers className="text-3xl text-[#f97316]" />
            </div>
            <h3 className="text-xl font-bold">多角的分析</h3>
            <p className="text-stone-500 text-sm">
              自分・ターゲット・第三者の<br />
              視点から要望を深掘り。
            </p>
          </div>
        </PixelCard>

        <PixelCard title="STEP 3" className="h-full">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="bg-stone-100 p-4 rounded-full pixel-border-sm">
              <FaChartLine className="text-3xl text-[#f97316]" />
            </div>
            <h3 className="text-xl font-bold">選択と集中</h3>
            <p className="text-stone-500 text-sm">
              選択マップとレーダーチャートで<br />
              最適な解決策を決定。
            </p>
          </div>
        </PixelCard>
      </section>

      {/* Footer */}
      <footer className="mt-20 text-stone-400 text-sm">
        © 2026 Co-Think Bigger. All rights reserved.
      </footer>
    </main>
  );
}
