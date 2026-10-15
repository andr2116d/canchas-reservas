export function MensajeServidor({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="rounded-lg bg-error-fondo px-3 py-2 text-sm text-error">
      {mensaje}
    </p>
  );
}
