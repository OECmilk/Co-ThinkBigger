"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function PixelInput({ className, label, id, ...props }: PixelInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="font-bold text-sm text-stone-600">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "bg-white pixel-border-sm px-4 py-2 focus:outline-none focus:bg-orange-50",
          className
        )}
        {...props}
      />
    </div>
  );
}
