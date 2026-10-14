import { cn } from "@/lib/cn";

const variantes = {
  primario: "bg-cesped-600 text-white hover:bg-cesped-700",
  secundario: "border border-linea bg-superficie text-texto hover:bg-fondo",
  fantasma: "text-texto hover:bg-linea/50",
  peligro: "bg-error text-white hover:bg-error/90",
};

type Props = React.ComponentProps<"button"> & {
  variante?: keyof typeof variantes;
  cargando?: boolean;
};

export function Button({ variante = "primario", cargando, disabled, className, children, ...props }: Props) {
  return (
    <button
      disabled={disabled || cargando}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantes[variante],
        className,
      )}
      {...props}
    >
      {cargando && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
    />
  );
}
