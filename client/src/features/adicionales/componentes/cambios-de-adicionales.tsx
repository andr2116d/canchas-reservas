import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { type AccionSobreAdicional, type CambioDeAdicional, type CambiosDeAdicional, enSoles, type ResumenDeAdicional } from "../servicios/adicionales";

const VERBO: Record<AccionSobreAdicional, string> = {
  ALTA: "creó",
  EDICION: "editó",
  DESACTIVACION: "desactivó",
  REACTIVACION: "reactivó",
  ELIMINACION: "eliminó",
};

const enAlta = (detalle: CambioDeAdicional["detalle"]): detalle is ResumenDeAdicional =>
  detalle !== null && typeof detalle.precio === "string";

function describirEdicion(cambios: CambiosDeAdicional): string {
  const partes: string[] = [];
  if (cambios.nombre) partes.push(`nombre ${cambios.nombre.antes} → ${cambios.nombre.despues}`);
  if (cambios.precio) partes.push(`precio ${enSoles(cambios.precio.antes ?? "")} → ${enSoles(cambios.precio.despues ?? "")}`);
  if (cambios.descripcion) partes.push("cambió la descripción");
  return partes.join(" · ");
}

/** Qué cambió, en palabras: el precio con que se creó o el antes y el después de una edición. */
function detalleDelCambio({ accion, detalle }: CambioDeAdicional): string {
  if (accion === "ALTA" && enAlta(detalle)) return ` a ${enSoles(detalle.precio)}`;
  if (accion === "EDICION" && detalle && !enAlta(detalle)) return `: ${describirEdicion(detalle)}`;
  return "";
}

/** Historial plegado: quién hizo cada cambio en el catálogo, cuándo y qué cambió. */
export function CambiosDeAdicionales({ cambios }: { cambios: CambioDeAdicional[] }) {
  if (cambios.length === 0) return null;
  return (
    <details className="rounded-2xl border border-white/80 bg-papel px-5 py-1 text-sm shadow-sm">
      <summary className="cursor-pointer py-3 font-bold text-tinta">Cambios recientes</summary>
      <ol className="mb-4 flex flex-col gap-2">
        {cambios.map((cambio, indice) => (
          <li key={`${cambio.ocurridoEn}-${indice}`} className="flex flex-wrap gap-x-3">
            <time dateTime={cambio.ocurridoEn} className="min-w-40 text-grava tabular-nums">{fechaEnLima(cambio.ocurridoEn)}</time>
            <span className="min-w-0 flex-1">
              {cambio.ejecutadoPor} {VERBO[cambio.accion]} <b>{cambio.nombreDelAdicional}</b>
              {detalleDelCambio(cambio)}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}
