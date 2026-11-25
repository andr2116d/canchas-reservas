"use client";

import { Fragment, useState } from "react";
import type { CanchaDelMapa, TurnoDelMapa, TurnoElegido } from "../servicios/disponibilidad";
import { enSoles, TEXTO_DEL_ESTADO, textoDeLaFranja } from "../utilidades/textos-del-mapa";

interface TablaDeTurnosProps {
  canchas: CanchaDelMapa[];
  turnos: TurnoDelMapa[];
  inicioDeLaNoche: string;
  duracionDelTurnoHoras: number;
  /** La hora del server: los turnos que ya empezaron se pliegan arriba. */
  ahora: string;
  elegido?: Omit<TurnoElegido, "tipo">;
  alElegir: (turno: TurnoDelMapa, cancha: CanchaDelMapa) => void;
}

function CabeceraDelTurno({ turno }: { turno: TurnoDelMapa }) {
  return (
    <th scope="row" className="py-1.5 pr-3 pl-4 text-left align-middle font-normal whitespace-nowrap">
      <span className="font-titular text-2xl leading-none font-extrabold tabular-nums">{turno.desde}</span>
      <span className="ml-1 text-xs text-grava tabular-nums">a {turno.hasta}</span>
      {turno.corto && <span className="ml-1.5 rounded-full bg-tiza px-1.5 py-0.5 text-[0.65rem] font-bold text-grava">Turno corto</span>}
      <span className="mt-0.5 block text-xs text-grava tabular-nums">
        <strong className="text-sm text-tinta">{enSoles(turno.precio)}</strong> · {turno.adelanto ? `Adelanto ${enSoles(turno.adelanto)}` : "Adelanto por definir"}
      </span>
    </th>
  );
}

function CeldasDelTurno({ turno, canchas, elegido, alElegir }: Pick<TablaDeTurnosProps, "canchas" | "elegido" | "alElegir"> & { turno: TurnoDelMapa }) {
  return canchas.map((cancha) => {
    const estado = turno.canchas.find((c) => c.canchaId === cancha.id)?.estado ?? "OCUPADO";
    const texto = TEXTO_DEL_ESTADO[estado];
    const descripcion = `${cancha.nombre}, de ${turno.desde} a ${turno.hasta}: ${texto.toLowerCase()}`;
    return (
      <td key={cancha.id} className="p-1">
        {estado === "DISPONIBLE" ? (
          <button
            type="button"
            data-estado={estado}
            aria-pressed={elegido?.canchaId === cancha.id && elegido.desde === turno.desde}
            aria-label={`${descripcion}, ${enSoles(turno.precio)}`}
            onClick={() => alElegir(turno, cancha)}
            className="celda-del-turno"
          >
            {texto}
          </button>
        ) : (
          <span data-estado={estado} aria-label={descripcion} className="celda-del-turno">{texto}</span>
        )}
      </td>
    );
  });
}

/** Turnos de un tipo de cancha: una fila por turno con su precio y adelanto, una columna por cancha. */
export function TablaDeTurnos({ canchas, turnos, inicioDeLaNoche, duracionDelTurnoHoras, ahora, elegido, alElegir }: TablaDeTurnosProps) {
  const [verEmpezados, setVerEmpezados] = useState(false);
  const empezados = turnos.filter((turno) => new Date(turno.inicio) <= new Date(ahora));
  const visibles = verEmpezados ? turnos : turnos.filter((turno) => !empezados.includes(turno));
  const columnas = canchas.length + 1;

  return (
    <div className="mapa-de-turnos">
      <table>
        <thead>
          <tr>
            <th scope="col" className="py-3 pl-4 text-left align-bottom text-xs font-semibold text-grava">Turno de {duracionDelTurnoHoras} h</th>
            {canchas.map((cancha) => (
              <th key={cancha.id} scope="col" className="px-1 py-3 align-bottom">
                <span className="block text-sm font-bold">{cancha.nombre}</span>
                <span className="block text-[0.7rem] font-medium text-grava">{cancha.tieneIluminacion ? "Con luz" : "Solo luz natural"}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empezados.length > 0 && (
            <tr>
              <td colSpan={columnas} className="bg-tiza/60 px-4 py-2">
                <button type="button" aria-expanded={verEmpezados} onClick={() => setVerEmpezados(!verEmpezados)} className="text-sm font-bold text-botella underline underline-offset-4">
                  {verEmpezados ? "Ocultar" : "Mostrar"} {empezados.length === 1 ? "el turno que ya empezó" : `los ${empezados.length} turnos que ya empezaron`}
                </button>
              </td>
            </tr>
          )}
          {visibles.map((turno, indice) => (
            <Fragment key={turno.desde}>
              {turno.franja !== visibles[indice - 1]?.franja && (
                <tr>
                  <th scope="rowgroup" colSpan={columnas} className="bg-tiza/60 px-4 pt-2.5 pb-1.5 text-left text-xs font-bold text-botella">
                    {textoDeLaFranja(turno.franja, inicioDeLaNoche)}
                  </th>
                </tr>
              )}
              <tr>
                <CabeceraDelTurno turno={turno} />
                <CeldasDelTurno turno={turno} canchas={canchas} elegido={elegido} alElegir={alElegir} />
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
