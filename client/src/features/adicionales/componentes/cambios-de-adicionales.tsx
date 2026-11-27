import { ListaDeCambiosRecientes } from "@/compartido/ui/lista-de-cambios-recientes";
import { enSoles } from "@/compartido/ui/textos-del-local";
import type { AccionSobreAdicional, CambioDeAdicional, CambiosDeAdicional, ResumenDeAdicional } from "../servicios/adicionales";

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

/** Quién hizo cada cambio en el catálogo, cuándo y qué cambió. */
export function CambiosDeAdicionales({ cambios }: { cambios: CambioDeAdicional[] }) {
  return (
    <ListaDeCambiosRecientes
      cambios={cambios.map((cambio) => ({
        ocurridoEn: cambio.ocurridoEn,
        frase: (
          <>
            {cambio.ejecutadoPor} {VERBO[cambio.accion]} <b>{cambio.nombreDelAdicional}</b>
            {detalleDelCambio(cambio)}
          </>
        ),
      }))}
    />
  );
}
