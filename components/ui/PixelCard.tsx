import { cn } from "@/lib/utils";
import React from "react";

interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  /** raised: 太枠＋段差影 / flat: 薄枠＋淡い影（情報量が多い画面向け） */
  tone?: "raised" | "flat";
  children: React.ReactNode;
}

export function PixelCard({ className, title, tone = "flat", children, ...props }: PixelCardProps) {
  return (
    <div
      className={cn(
        tone === "raised" ? "card-raised" : "card",
        "p-5 relative",
        className
      )}
      {...props}
    >
      {title && (
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-3)] mb-3 font-display">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
