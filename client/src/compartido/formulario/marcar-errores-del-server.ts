import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

/** Muestra junto a cada campo lo que respondió el server y enfoca el primero. */
export function marcarErroresDelServer<T extends FieldValues>(
  formulario: UseFormReturn<T>,
  errores: Partial<Record<string, string>>,
) {
  const campos = Object.keys(errores) as Path<T>[];
  for (const campo of campos) {
    formulario.setError(campo, { type: "server", message: errores[campo] });
  }
  if (campos[0]) formulario.setFocus(campos[0]);
}
