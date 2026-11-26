import { DIAS_DE_LA_SEMANA, type DiaDeLaSemana } from "@/compartido/horario/horario";
import type { Simulacion, TurnoConPrecio, TurnosDeUnDia } from "@/compartido/horario/simulacion";

const turno = (desde: string, hasta: string, total: string, extra: Partial<TurnoConPrecio> = {}): TurnoConPrecio => ({
  desde,
  hasta,
  corto: false,
  total,
  tramos: [{ franja: "DIA", desde, hasta, monto: total }],
  ...extra,
});

/** Lunes de 08:00 a 22:00 con turnos de 3 horas de fútbol 7 a S/ 50 de día y S/ 100 de noche. */
export const LUNES_DE_PRUEBA: TurnosDeUnDia = {
  estado: "ABIERTO",
  duracionDelTurnoHoras: 3,
  inicioDeLaNoche: "18:00",
  turnos: [
    turno("08:00", "11:00", "50.00"),
    turno("11:00", "14:00", "50.00"),
    turno("14:00", "17:00", "50.00"),
    turno("17:00", "20:00", "83.33", {
      tramos: [
        { franja: "DIA", desde: "17:00", hasta: "18:00", monto: "16.67" },
        { franja: "NOCHE", desde: "18:00", hasta: "20:00", monto: "66.66" },
      ],
    }),
  ],
  sinTurno: { desde: "20:00", hasta: "22:00" },
};

/** Respuesta de la simulación para pruebas: los días indicados y el resto cerrado. */
export function simulacionDePrueba(tipo: string, dias: Partial<Record<DiaDeLaSemana, TurnosDeUnDia>>): Simulacion {
  const semana = Object.fromEntries(DIAS_DE_LA_SEMANA.map((dia) => [dia, dias[dia] ?? { estado: "CERRADO" }])) as Record<DiaDeLaSemana, TurnosDeUnDia>;
  return { tipos: { [tipo]: semana } };
}
