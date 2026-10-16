import { cn } from "@/lib/cn";

const tonos = {
  error: "bg-error-fondo text-error",
  info: "bg-info-fondo text-info",
  exito: "bg-exito-fondo text-exito",
};

type Props = {
  tono?: keyof typeof tonos;
  className?: string;
  children?: React.ReactNode;
};

export function Alerta({ tono = "error", className, children }: Props) {
  if (!children) return null;
  return (
    <p role={tono === "error" ? "alert" : "status"} className={cn("rounded-lg px-3 py-2 text-sm", tonos[tono], className)}>
      {children}
    </p>
  );
}
