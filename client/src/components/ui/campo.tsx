import { useId } from "react";
import { cn } from "@/lib/cn";

const base =
  "h-10 w-full rounded-lg border bg-superficie px-3 text-texto outline-none transition-colors focus:border-cesped-600 focus:ring-2 focus:ring-cesped-600/20 disabled:bg-fondo disabled:text-texto-apagado";

type Comunes = { etiqueta: string; error?: string; ayuda?: string };

function Envoltura({ id, etiqueta, error, ayuda, children }: Comunes & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-error">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-texto-suave">{ayuda}</p>
      )}
    </div>
  );
}

export function Input({ etiqueta, error, ayuda, className, id, ...props }: Comunes & React.ComponentProps<"input">) {
  const generado = useId();
  const campoId = id ?? generado;
  return (
    <Envoltura id={campoId} etiqueta={etiqueta} error={error} ayuda={ayuda}>
      <input
        id={campoId}
        aria-invalid={!!error}
        aria-describedby={error ? `${campoId}-error` : undefined}
        className={cn(base, error ? "border-error" : "border-linea", className)}
        {...props}
      />
    </Envoltura>
  );
}

export function Select({ etiqueta, error, ayuda, className, id, ...props }: Comunes & React.ComponentProps<"select">) {
  const generado = useId();
  const campoId = id ?? generado;
  return (
    <Envoltura id={campoId} etiqueta={etiqueta} error={error} ayuda={ayuda}>
      <select
        id={campoId}
        aria-invalid={!!error}
        aria-describedby={error ? `${campoId}-error` : undefined}
        className={cn(base, error ? "border-error" : "border-linea", className)}
        {...props}
      />
    </Envoltura>
  );
}
