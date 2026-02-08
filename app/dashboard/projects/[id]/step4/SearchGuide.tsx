"use client";

import { PixelCard } from "@/components/ui/PixelCard";
import { FaInfoCircle, FaSearch, FaExchangeAlt } from "react-icons/fa";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SearchGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-8">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 cursor-pointer text-[#f97316] font-bold hover:underline mb-2 select-none"
      >
        <FaInfoCircle />
        <span>検索アシスタント: より良い事例を見つけるために</span>
        <span className="text-stone-400 text-xs ml-2">Click to {isOpen ? "close" : "open"}</span>
      </div>

      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 transition-all overflow-hidden", isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
        <PixelCard className="bg-blue-50">
          <div className="flex items-center gap-2 mb-2 font-bold text-blue-800">
            <FaSearch /> 1. 汎用検索
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            サブ課題をより一般的な概念に抽象化して問い直します。<br />
            例：「算数嫌いの子どもをやる気にさせるには？」<br />
            →「子供の学習意欲を高めるには？」
          </p>
        </PixelCard>

        <PixelCard className="bg-indigo-50">
          <div className="flex items-center gap-2 mb-2 font-bold text-indigo-800">
            <FaSearch /> 2. 部分検索
          </div>
          <p className="text-xs text-indigo-700 leading-relaxed">
            課題の一部分や要素に着目して問い直します。<br />
            例: 「算数嫌いの子どもをやる気にさせるには？」<br />
            →「楽しくないことをやらせるには？」
          </p>
        </PixelCard>

        <PixelCard className="bg-green-50">
          <div className="flex items-center gap-2 mb-2 font-bold text-green-800">
            <FaExchangeAlt /> 3. 並行検索
          </div>
          <p className="text-xs text-green-700 leading-relaxed">
            似たような構造を持つ別の問題（アナロジー）に置き換えます。<br />
            例: 「算数嫌いの子どもをやる気にさせるには？」<br />
            →「子供に体によいものを食べさせるには？」
          </p>
        </PixelCard>
      </div>
    </div>
  );
}
