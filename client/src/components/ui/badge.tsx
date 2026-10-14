import { cn } from "@/lib/cn";

const tonos = {
  exito: "bg-exito-fondo text-exito",
  alerta: "bg-alerta-fondo text-alerta",
  error: "bg-error-fondo text-error",
  info: "bg-info-fondo text-info",
  neutro: "bg-linea text-texto-suave",
  juego: "bg-cesped-600 text-white",
};

export function Badge({ tono = "neutro", className, children }: { tono?: keyof typeof tonos; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tonos[tono], className)}>
      {children}
    </span>
  );
}
