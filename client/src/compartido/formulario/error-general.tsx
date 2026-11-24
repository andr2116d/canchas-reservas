/** Un error que no es de un campo, como la falta de conexión; se anuncia al aparecer. */
export function ErrorGeneral({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">
      {mensaje}
    </p>
  );
}
