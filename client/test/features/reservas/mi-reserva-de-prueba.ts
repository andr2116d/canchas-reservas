import type { MiReserva } from "@/features/reservas/servicios/reservas";

/** Recién separada: vence en 15 minutos según la hora del server. */
export function miReservaDePrueba(cambios: Partial<MiReserva> = {}): MiReserva {
  return {
    codigo: "7K3Q9X",
    estado: "PENDIENTE_DE_PAGO",
    cancha: { nombre: "Cancha 1", tipo: "FUTBOL_5", tieneIluminacion: true },
    fecha: "2026-11-28",
    desde: "19:00",
    hasta: "20:00",
    inicio: "2026-11-29T00:00:00.000Z",
    precio: "80.00",
    adelanto: "40.00",
    porcentajeDeAdelanto: 50,
    venceEn: "2026-11-27T15:15:00.000Z",
    ahora: "2026-11-27T15:00:00.000Z",
    plazos: [{ hasta: "2026-11-29T00:00:00.000Z", porcentaje: 0, ofreceCredito: false }],
    adicionales: [{ nombre: "Balón", precio: "35.00" }],
    ...cambios,
  };
}
