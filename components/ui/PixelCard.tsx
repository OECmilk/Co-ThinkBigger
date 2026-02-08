import { cn } from "@/lib/utils";
import React from "react";

interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
}

export function PixelCard({ className, title, children, ...props }: PixelCardProps) {
  return (
    <div
      className={cn(
        "bg-white pixel-border p-6 relative",
        className
      )}
      {...props}
    >
      {title && (
        <div className="absolute -top-4 left-4 bg-white border-2 border-stone-800 px-2 py-1 text-sm font-bold uppercase tracking-wider">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
