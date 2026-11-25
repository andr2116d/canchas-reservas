import type { Constancia } from "@/features/libro-de-reclamaciones/servicios/libro";

/** La constancia que devuelve la API para una hoja de prueba. */
export function unaConstancia(cambios: Partial<Constancia> = {}): Constancia {
  return {
    numero: "000014-2026",
    codigo: "K7QP-4ZMD",
    registradaEn: "2026-11-25T15:00:00.000Z",
    fechaLimite: "2026-12-16",
    proveedor: { razonSocial: null, ruc: null, direccion: null },
    hoja: {
      consumidor: {
        documento: { tipo: "DNI", numero: "45871236" },
        nombres: "Valeria",
        apellidos: "León Paredes",
        domicilio: "Av. América Sur 1250, Trujillo",
        telefono: "987654321",
        correo: "valeria.leon@gmail.com",
      },
      representante: null,
      servicio: { servicio: "RESERVA_DE_CANCHA", montoReclamado: "40.00", descripcion: null },
      tipo: "RECLAMO",
      detalle: "La cancha estaba ocupada.",
      pedido: "Que devuelvan el adelanto.",
      medioDeRespuesta: "CORREO",
    },
    ...cambios,
  };
}
