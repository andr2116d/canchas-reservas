import type { TipoCompensacion } from "./api";

const DESTINO_ADELANTO: Record<TipoCompensacion, string> = {
  DEVOLUCION: "en recepción",
  CREDITO: "como crédito",
};

type Datos = {
  horasAnticipacion: number | null;
  tipoCompensacion: TipoCompensacion;
  plazo?: string;
};

function hastaCuando({ horasAnticipacion, plazo }: Datos) {
  if (horasAnticipacion === null) return "con la anticipación indicada";
  if (horasAnticipacion === 0) return "hasta el inicio del turno";
  if (plazo) return `hasta el ${plazo} (${horasAnticipacion} h antes)`;
  return `hasta ${horasAnticipacion} h antes del inicio del turno`;
}

export function textoReglaCancelacion(datos: Datos) {
  return `Puedes cancelar ${hastaCuando(datos)} y se te devolverá tu adelanto ${DESTINO_ADELANTO[datos.tipoCompensacion]}. Si cancelas después, el adelanto queda retenido.`;
}
