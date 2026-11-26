import { EncabezadoDeSeccion } from "./encabezado-de-seccion";

/**
 * Maqueta de una sección que todavía no tiene funciones: muestra cómo se
 * ordenará la pantalla, sin datos inventados.
 */
export function SeccionEnPreparacion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <>
      <EncabezadoDeSeccion titulo={titulo} descripcion={descripcion} />
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="h-64 rounded-2xl border border-white/80 bg-papel/70 shadow-sm" />
        <div className="grid gap-4">
          <div className="h-30 rounded-2xl border border-white/80 bg-papel/70 shadow-sm" />
          <div className="h-30 rounded-2xl border border-white/80 bg-papel/70 shadow-sm" />
        </div>
      </div>
      <p className="text-grava">Muy pronto podrás usar esta sección.</p>
    </>
  );
}
