import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";

/** Hasta qué momento (incluido) rige un rango de la regla de cancelación para este turno. */
export interface PlazoDeCancelacion {
  hasta: string;
  porcentaje: number;
  ofreceCredito: boolean;
}

/** Material del local que se puede pedir que tengan listo, con su precio por unidad perdida o rota. */
export interface AdicionalOfrecido {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
}

export interface CanchaDeLaReserva {
  nombre: string;
  tipo: TipoDeCancha;
  tieneIluminacion: boolean;
}

/** Lo que se ve antes de separar el turno, con las reglas vigentes. */
export interface ResumenDeReserva {
  cancha: CanchaDeLaReserva & { id: number };
  fecha: string;
  desde: string;
  hasta: string;
  inicio: string;
  precio: string;
  adelanto: string;
  porcentajeDeAdelanto: number;
  minutosDeRetencion: number;
  plazos: PlazoDeCancelacion[];
  adicionales: AdicionalOfrecido[];
}

export type EstadoDeReserva = "PENDIENTE_DE_PAGO" | "PENDIENTE_DE_VALIDACION" | "CONFIRMADA" | "EN_JUEGO" | "EXPIRADA";

/** Una reserva propia, con la hora del server para medir cuánto falta. */
export interface MiReserva {
  codigo: string;
  estado: EstadoDeReserva;
  cancha: CanchaDeLaReserva;
  fecha: string;
  desde: string;
  hasta: string;
  inicio: string;
  precio: string;
  adelanto: string;
  porcentajeDeAdelanto: number;
  venceEn: string | null;
  ahora: string;
  plazos: PlazoDeCancelacion[];
  adicionales: { nombre: string; precio: string }[];
}

/** El turno elegido, los montos que se mostraron y el material pedido. */
export interface PedidoDeReserva {
  canchaId: number;
  fecha: string;
  desde: string;
  precio: string;
  adelanto: string;
  adicionales: number[];
}
