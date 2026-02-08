import { cn } from "@/lib/utils";

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <div className="w-8 h-8 bg-[#f97316] animate-spin border-4 border-stone-800 mb-4 shadow-[4px_4px_0_0_#292524]"></div>
      <p className="text-stone-600 font-bold animate-pulse tracking-widest text-sm">LOADING...</p>
    </div>
  );
}
