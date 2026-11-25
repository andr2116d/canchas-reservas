import type { EstadoDelTurno } from "../servicios/disponibilidad";

const MUESTRAS: [EstadoDelTurno, string][] = [
  ["DISPONIBLE", "Libre"],
  ["PENDIENTE", "Pendiente: puede liberarse"],
  ["OCUPADO", "Ocupado"],
  ["MANTENIMIENTO", "Mantenimiento"],
  ["YA_EMPEZO", "No se puede elegir"],
];

/** Qué significa cada color del mapa. */
export function LeyendaDeEstados() {
  return (
    <ul aria-label="Qué significa cada color" className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-grava">
      {MUESTRAS.map(([estado, texto]) => (
        <li key={estado} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" data-estado={estado} className="celda-del-turno muestra-del-estado" />
          {texto}
        </li>
      ))}
    </ul>
  );
}
