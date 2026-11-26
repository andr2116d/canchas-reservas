import { ListaDeCambiosRecientes } from "@/compartido/ui/lista-de-cambios-recientes";
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

/** Quién hizo cada cambio en las canchas y cuándo. */
export function CambiosRecientes({ cambios }: { cambios: CambioDeCancha[] }) {
  return (
    <ListaDeCambiosRecientes
      cambios={cambios.map((cambio) => ({
        ocurridoEn: cambio.ocurridoEn,
        frase: <>{cambio.ejecutadoPor} {VERBO[cambio.accion]} <b>{cambio.nombreDeLaCancha}</b></>,
      }))}
    />
  );
}
