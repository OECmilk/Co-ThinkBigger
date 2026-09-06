"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { Spinner } from "./Spinner";

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** 処理中表示。true の間は自動で無効化される */
  loading?: boolean;
}

const VARIANTS: Record<NonNullable<PixelButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--accent)] text-white border-2 border-[var(--line-strong)] pixel-shadow hover:bg-[var(--accent-hover)]",
  secondary:
    "bg-white text-[var(--ink)] border-2 border-[var(--line-strong)] pixel-shadow hover:bg-[var(--surface-2)]",
  outline:
    "bg-transparent text-[var(--ink)] border-2 border-dashed border-[var(--ink-3)] hover:border-[var(--ink)] hover:bg-[var(--surface-2)]",
  ghost: "bg-transparent text-[var(--ink-2)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)]",
  danger:
    "bg-[var(--danger)] text-white border-2 border-[var(--line-strong)] pixel-shadow hover:brightness-110",
};

const SIZES: Record<NonNullable<PixelButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
};

export function PixelButton({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: PixelButtonProps) {
  return (
    <button
      className={cn(
        "press inline-flex items-center justify-center font-bold rounded-[3px] select-none",
        "disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size={size === "sm" ? 10 : 12} />}
      {children}
    </button>
  );
}
