import type { EstadoDelTurno, MapaDelDia, TurnoDelMapa } from "@/features/disponibilidad/servicios/disponibilidad";

function turno(desde: string, hasta: string, estados: [EstadoDelTurno, EstadoDelTurno], noche: boolean): TurnoDelMapa {
  return {
    desde,
    hasta,
    corto: false,
    franja: noche ? "NOCHE" : "DIA",
    precio: noche ? "80.00" : "60.00",
    adelanto: noche ? "40.00" : "30.00",
    inicio: `2026-11-25T${String(Number(desde.slice(0, 2)) + 5).padStart(2, "0")}:00:00.000Z`,
    canchas: [
      { canchaId: 1, estado: estados[0] },
      { canchaId: 2, estado: estados[1] },
    ],
  };
}

/**
 * Un día abierto de 16:00 a 21:00 con dos canchas de fútbol 5 (la 2 sin luz) y una de
 * fútbol 7 sin tarifa. La noche empieza a las 18:00 y el adelanto es 50 %.
 */
export function mapaDePrueba(cambios: Partial<MapaDelDia> = {}): MapaDelDia {
  return {
    fecha: "2026-11-25",
    hoy: "2026-11-24",
    ultimaFecha: "2026-12-24",
    ahora: "2026-11-24T20:20:00.000Z",
    adelanto: 50,
    local: "ABIERTO",
    proximoCambio: null,
    tipos: [
      {
        tipo: "FUTBOL_5",
        estado: "CON_TURNOS",
        duracionDelTurnoHoras: 1,
        inicioDeLaNoche: "18:00",
        canchas: [
          { id: 1, nombre: "Cancha 1", tieneIluminacion: true },
          { id: 2, nombre: "Cancha 2", tieneIluminacion: false },
        ],
        turnos: [
          turno("16:00", "17:00", ["YA_EMPEZO", "OCUPADO"], false),
          turno("17:00", "18:00", ["DISPONIBLE", "PENDIENTE"], false),
          turno("18:00", "19:00", ["DISPONIBLE", "SIN_LUZ"], true),
          turno("19:00", "20:00", ["MANTENIMIENTO", "SIN_LUZ"], true),
          turno("20:00", "21:00", ["OCUPADO", "SIN_LUZ"], true),
        ],
      },
      { tipo: "FUTBOL_7", estado: "SIN_TARIFA", canchas: [{ id: 3, nombre: "Cancha 3", tieneIluminacion: true }] },
    ],
    ...cambios,
  };
}
