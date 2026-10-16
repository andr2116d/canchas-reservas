import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ErrorApi } from "@/lib/api";

export function aplicarErroresServidor<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  campos: Path<T>[],
) {
  const errorApi = error instanceof ErrorApi ? error : null;
  let asignado = false;
  for (const [campo, mensaje] of Object.entries(errorApi?.errores ?? {})) {
    if (!(campos as string[]).includes(campo)) continue;
    setError(campo as Path<T>, { type: "server", message: mensaje }, { shouldFocus: !asignado });
    asignado = true;
  }
  if (!asignado) {
    setError("root.servidor", { type: "server", message: errorApi?.message ?? "Ocurrió un error" });
  }
}
