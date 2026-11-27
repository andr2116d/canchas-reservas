import type { ResumenDeReserva } from "@/features/reservas/servicios/reservas";

/** Cancha 1, sábado 28 de 19:00 a 20:00, a S/ 80 con S/ 40 de adelanto, regla de tres plazos y un balón. */
export function resumenDePrueba(cambios: Partial<ResumenDeReserva> = {}): ResumenDeReserva {
  return {
    cancha: { id: 1, nombre: "Cancha 1", tipo: "FUTBOL_5", tieneIluminacion: true },
    fecha: "2026-11-28",
    desde: "19:00",
    hasta: "20:00",
    inicio: "2026-11-29T00:00:00.000Z",
    precio: "80.00",
    adelanto: "40.00",
    porcentajeDeAdelanto: 50,
    minutosDeRetencion: 15,
    plazos: [
      { hasta: "2026-11-28T00:00:00.000Z", porcentaje: 100, ofreceCredito: true },
      { hasta: "2026-11-28T22:00:00.000Z", porcentaje: 50, ofreceCredito: false },
      { hasta: "2026-11-29T00:00:00.000Z", porcentaje: 0, ofreceCredito: false },
    ],
    adicionales: [
      { id: 11, nombre: "Balón", descripcion: "Número 5", precio: "35.00" },
      { id: 12, nombre: "Chalecos", descripcion: null, precio: "6.00" },
    ],
    ...cambios,
  };
}
