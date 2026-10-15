"use client";

import { ETIQUETA_TAMANO, type Cancha, type Turno } from "../api";
import { IconoIluminacion } from "./icono-iluminacion";
import { CeldaTurno } from "./turno-disponibilidad";

type Props = {
  canchas: Cancha[];
  onElegir: (cancha: Cancha, turno: Turno) => void;
};

/** Todas las horas del día, en orden, aunque una cancha no tenga esa fila. */
function horasDelDia(canchas: Cancha[]) {
  const horas = new Set<string>();
  for (const cancha of canchas) {
    for (const turno of cancha.turnos) horas.add(turno.horaInicio);
  }
  return [...horas].sort();
}

export function GrillaDisponibilidad({ canchas, onElegir }: Props) {
  const horas = horasDelDia(canchas);

  return (
    <div className="hidden lg:block">
      <table className="w-full border-collapse">
        <caption className="sr-only">Turnos disponibles por cancha</caption>
        <thead>
          <tr>
            <th scope="col" className="w-20 px-2 pb-2 text-left text-sm font-medium text-texto-suave">
              Hora
            </th>
            {canchas.map((cancha) => (
              <th key={cancha.id} scope="col" className="px-2 pb-2 text-left">
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-texto">{cancha.nombre}</span>
                  <span className="text-xs font-normal text-texto-suave">{ETIQUETA_TAMANO[cancha.tamano]}</span>
                  <IconoIluminacion encendida={cancha.iluminacion} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horas.map((hora) => (
            <tr key={hora}>
              <th scope="row" className="px-2 py-1 text-left text-sm font-medium tabular-nums text-texto-suave">
                {hora}
              </th>
              {canchas.map((cancha) => {
                const turno = cancha.turnos.find((t) => t.horaInicio === hora);
                return (
                  <td key={cancha.id} className="p-0.5">
                    {turno ? (
                      <CeldaTurno turno={turno} onElegir={(t) => onElegir(cancha, t)} />
                    ) : (
                      <div className="min-h-11" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
