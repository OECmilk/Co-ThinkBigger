"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

export function PixelButton({ className, variant = "primary", children, ...props }: PixelButtonProps) {
  const baseStyles = "pixel-border-sm px-6 py-2 font-bold focus:outline-none transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none";

  const variants = {
    primary: "bg-[#f97316] text-white hover:bg-[#ea580c] pixel-shadow",
    secondary: "bg-white text-stone-800 hover:bg-stone-50 pixel-shadow",
    outline: "bg-transparent border-2 border-dashed border-stone-800 hover:bg-stone-100",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
