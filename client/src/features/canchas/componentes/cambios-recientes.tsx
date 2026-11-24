import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import type { AccionSobreCancha, CambioDeCancha } from "../servicios/canchas";

const VERBO: Record<AccionSobreCancha, string> = {
  ALTA: "creó",
  EDICION: "editó",
  DESACTIVACION: "desactivó",
  REACTIVACION: "reactivó",
  ELIMINACION: "eliminó",
  BLOQUEO: "bloqueó por mantenimiento",
  LIBERACION_DE_BLOQUEO: "liberó antes el mantenimiento de",
  RETIRO_DE_BLOQUEO: "quitó un bloqueo de",
};

/** Historial plegado: quién hizo cada cambio en las canchas y cuándo. */
export function CambiosRecientes({ cambios }: { cambios: CambioDeCancha[] }) {
  if (cambios.length === 0) return null;
  return (
    <details className="rounded-2xl border border-white/80 bg-papel px-5 py-1 text-sm shadow-sm">
      <summary className="cursor-pointer py-3 font-bold text-tinta">Cambios recientes</summary>
      <ol className="mb-4 flex flex-col gap-2">
        {cambios.map((cambio, indice) => (
          <li key={`${cambio.ocurridoEn}-${indice}`} className="flex flex-wrap gap-x-3">
            <time dateTime={cambio.ocurridoEn} className="min-w-40 text-grava tabular-nums">{fechaEnLima(cambio.ocurridoEn)}</time>
            <span>{cambio.ejecutadoPor} {VERBO[cambio.accion]} <b>{cambio.nombreDeLaCancha}</b></span>
          </li>
        ))}
      </ol>
    </details>
  );
}
