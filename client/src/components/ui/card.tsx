import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-linea bg-superficie p-6 shadow-sm", className)} {...props} />;
}
