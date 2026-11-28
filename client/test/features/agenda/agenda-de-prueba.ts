import type { AgendaDelDia, TurnoDeLaAgenda } from "@/features/agenda/servicios/agenda";

/** Una reserva confirmada de Cancha 1, de 19:00 a 20:00, sin pagos: el saldo es todo el precio. */
export function turnoDePrueba(cambios: Partial<TurnoDeLaAgenda> = {}): TurnoDeLaAgenda {
  return {
    codigo: "7K3Q9X",
    estado: "CONFIRMADA",
    desde: "19:00",
    hasta: "20:00",
    cancha: { id: 1, nombre: "Cancha 1", tipo: "FUTBOL_5" },
    cliente: { nombre: "Lucía Ramos Vega", celular: "987654321" },
    precio: "80.00",
    adelanto: "40.00",
    pagado: "0.00",
    saldo: "80.00",
    pagada: false,
    venceEn: null,
    acciones: ["CHECK_IN", "MARCAR_AUSENTE", "CANCELAR", "REUBICAR"],
    ...cambios,
  };
}

/** La agenda del sábado 28 de noviembre de 2026 (hoy), con dos canchas y un turno. */
export function agendaDePrueba(cambios: Partial<AgendaDelDia> = {}): AgendaDelDia {
  return {
    fecha: "2026-11-28",
    hoy: "2026-11-28",
    ultimaFecha: "2026-12-28",
    ahora: "2026-11-28T20:00:00.000Z",
    proximoCambio: null,
    canchas: [
      { id: 1, nombre: "Cancha 1", tipo: "FUTBOL_5" },
      { id: 2, nombre: "Cancha 2", tipo: "FUTBOL_7" },
    ],
    conteos: { PENDIENTE_DE_PAGO: 0, PENDIENTE_DE_VALIDACION: 0, CONFIRMADA: 1, EN_JUEGO: 0, EXPIRADA: 0 },
    turnos: [turnoDePrueba()],
    ...cambios,
  };
}
