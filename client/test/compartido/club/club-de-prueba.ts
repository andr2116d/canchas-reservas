import type { ClubPublico } from "@/compartido/club/servicios/club";

/** Un club con dos canchas de fútbol 5 (una sin luz), una de fútbol 7 y todo configurado. */
export function clubDePrueba(cambios: Partial<ClubPublico> = {}): ClubPublico {
  return {
    canchas: [
      { id: 1, nombre: "Cancha 1", tipo: "FUTBOL_5", tieneIluminacion: true, caracteristicas: ["BANCAS"], nota: "Junto al ingreso." },
      { id: 2, nombre: "Cancha 2", tipo: "FUTBOL_5", tieneIluminacion: false, caracteristicas: [], nota: null },
      { id: 3, nombre: "Cancha 3", tipo: "FUTBOL_7", tieneIluminacion: true, caracteristicas: ["GRADERIAS"], nota: null },
    ],
    tarifas: [
      { tipo: "FUTBOL_5", precioDia: "60.00", precioNoche: "80.00", duracionDelTurnoHoras: 1 },
      { tipo: "FUTBOL_7", precioDia: "120.00", precioNoche: "150.00", duracionDelTurnoHoras: 2 },
    ],
    horario: { dias: [{ dia: "LUNES", abre: "08:00", cierra: "23:00", inicioDeLaNoche: "18:00" }] },
    adelanto: 50,
    cancelacion: [
      { desdeHoras: 24, porcentaje: 100, ofreceCredito: true },
      { desdeHoras: 0, porcentaje: 0, ofreceCredito: false },
    ],
    adicionales: [{ nombre: "Balón", descripcion: "N.º 5", precio: "45.00" }],
    ...cambios,
  };
}
