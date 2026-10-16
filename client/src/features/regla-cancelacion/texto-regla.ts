import type { TipoCompensacion } from "./api";

const DESTINO_ADELANTO: Record<TipoCompensacion, string> = {
  DEVOLUCION: "en recepción",
  CREDITO: "como crédito",
};

type Datos = {
  horasAnticipacion: number | null;
  tipoCompensacion: TipoCompensacion;
  plazo?: string;
  vencido?: boolean;
};

function hastaCuando({ horasAnticipacion, plazo }: Datos) {
  if (horasAnticipacion === null) return "con la anticipación indicada";
  if (horasAnticipacion === 0) return "hasta el inicio del turno";
  if (plazo) return `hasta el ${plazo} (${horasAnticipacion} h antes)`;
  return `hasta ${horasAnticipacion} h antes del inicio del turno`;
}

function cuandoVencio({ horasAnticipacion, plazo }: Datos) {
  const antes = horasAnticipacion === null ? "" : ` (${horasAnticipacion} h antes del turno)`;
  if (plazo) return `venció el ${plazo}${antes}`;
  return `${antes} ya pasó`.trimStart();
}

export function textoReglaCancelacion(datos: Datos) {
  if (datos.vencido) {
    return `El plazo para cancelar sin perder el adelanto ${cuandoVencio(datos)}. Si cancelas, el adelanto queda retenido.`;
  }
  return `Puedes cancelar ${hastaCuando(datos)} y se te devolverá tu adelanto ${DESTINO_ADELANTO[datos.tipoCompensacion]}. Si cancelas después, el adelanto queda retenido.`;
}
