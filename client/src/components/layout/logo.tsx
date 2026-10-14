import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-extrabold italic uppercase tracking-tight", className)}>
      La Previa<span className="text-cal-400">.</span>
    </span>
  );
}
