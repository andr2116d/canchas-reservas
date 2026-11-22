export type ParametrosDeAcceso = Promise<{ motivo?: string | string[] }>;

/** Avisa que la sesión anterior se cerró por inactividad, si de ahí viene la persona. */
export async function AvisoDeInactividad({ parametros }: { parametros: ParametrosDeAcceso }) {
  const { motivo } = await parametros;
  if (motivo !== "inactividad") return null;
  return (
    <p role="status" className="mb-5 rounded-lg bg-tiza px-4 py-3 text-sm text-grava">
      Tu sesión se cerró por inactividad.
    </p>
  );
}
