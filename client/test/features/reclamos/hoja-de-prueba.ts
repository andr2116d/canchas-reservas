import type { FilaDeHoja, HojaParaAtender } from "@/features/reclamos/servicios/reclamos";

/** Una fila de la lista de administración, por responder y a tiempo. */
export function unaFila(cambios: Partial<FilaDeHoja> = {}): FilaDeHoja {
  return {
    numero: "000014-2026",
    tipo: "RECLAMO",
    tipoMarcado: "RECLAMO",
    motivo: null,
    estado: "NUEVA",
    medioDeRespuesta: "CORREO",
    registradaEn: "2026-11-25T15:00:00.000Z",
    fechaLimite: "2026-12-16",
    diasHabilesRestantes: 10,
    vencida: false,
    respondidaEn: null,
    fueraDePlazo: false,
    nombre: "Valeria León Paredes",
    resumen: "La cancha estaba ocupada.",
    ...cambios,
  };
}

/** Una hoja completa para atender. */
export function unaHojaParaAtender(cambios: Partial<HojaParaAtender> = {}): HojaParaAtender {
  const fila: Partial<FilaDeHoja> = { ...unaFila() };
  delete fila.nombre;
  delete fila.resumen;
  return {
    ...(fila as Omit<FilaDeHoja, "nombre" | "resumen">),
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
    detalle: "La cancha estaba ocupada.",
    pedido: "Que devuelvan el adelanto.",
    abiertaEn: null,
    respuesta: null,
    cambios: [],
    ...cambios,
  };
}
