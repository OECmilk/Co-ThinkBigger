"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function PixelInput({ className, label, hint, id, ...props }: PixelInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="font-bold text-xs text-[var(--ink-2)]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full bg-white border-2 border-[var(--line-strong)] rounded-[3px] px-3 py-2.5 text-sm",
          "placeholder:text-[var(--ink-3)] focus:outline-none focus:bg-[var(--accent-soft)] transition-colors",
          className
        )}
        {...props}
      />
      {hint && <p className="text-[11px] text-[var(--ink-3)]">{hint}</p>}
    </div>
  );
}
