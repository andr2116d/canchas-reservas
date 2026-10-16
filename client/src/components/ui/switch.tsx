import { useId } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<React.ComponentProps<"input">, "type"> & {
  etiqueta: string;
  error?: string;
};

export function Switch({ etiqueta, error, className, id, ...props }: Props) {
  const generado = useId();
  const campoId = id ?? generado;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={campoId} className="inline-flex min-h-11 cursor-pointer items-center gap-3 md:min-h-10">
        <input
          id={campoId}
          type="checkbox"
          role="switch"
          aria-invalid={!!error}
          aria-describedby={error ? `${campoId}-error` : undefined}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full bg-linea transition-colors peer-checked:bg-cesped-600 peer-focus-visible:ring-2 peer-focus-visible:ring-cesped-600/20 peer-disabled:opacity-60",
            "after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-superficie after:shadow-sm after:transition-transform peer-checked:after:translate-x-5",
            className,
          )}
        />
        <span className="text-sm font-medium">{etiqueta}</span>
      </label>
      {error && (
        <p id={`${campoId}-error`} className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
