"use client";

import { useColumnaDelMarcador } from "./use-columna-del-marcador";

export interface ColumnaDelMarcadorProps {
  id: string;
  /** Nombre accesible, como «Horas de Abre». */
  nombre: string;
  valor: number;
  maximo: number;
  /** Lo que avanzan las flechas, los botones y la rueda. */
  paso: number;
  alCambiar: (valor: number) => void;
  /** Al escribir las dos cifras, por ejemplo para pasar a los minutos. */
  alCompletar?: () => void;
  deshabilitada?: boolean;
  invalida?: boolean;
  descripcion?: string;
  /** Cifras más chicas. */
  chica?: boolean;
}

const FLECHA =
  "flex h-6 w-full items-center justify-center rounded-md text-xs text-tiza/55 transition-colors " +
  "hover:bg-cancha-clara hover:text-capitan disabled:pointer-events-none disabled:opacity-30";

const CIFRA =
  "w-full rounded-lg bg-transparent text-center font-titular leading-none font-black text-capitan " +
  "tabular-nums caret-capitan outline-none focus-visible:bg-cancha-clara focus-visible:ring-2 " +
  "focus-visible:ring-capitan/60 disabled:text-tiza/35";

const minusculaInicial = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1);

/** Una cifra del marcador (horas o minutos) con sus flechas. */
export function ColumnaDelMarcador({ id, nombre, valor, maximo, deshabilitada, invalida, descripcion, chica, ...opciones }: ColumnaDelMarcadorProps) {
  const { ref, texto, eventos, alSubir, alBajar } = useColumnaDelMarcador({ valor, maximo, ...opciones });

  return (
    <div className={`flex flex-col items-center ${chica ? "w-10" : "w-13"}`}>
      <button type="button" tabIndex={-1} aria-label={`Subir ${minusculaInicial(nombre)}`} disabled={deshabilitada} onClick={alSubir} className={FLECHA}>▲</button>
      <input
        ref={ref}
        id={id}
        role="spinbutton"
        aria-label={nombre}
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={maximo}
        aria-invalid={invalida || undefined}
        aria-describedby={descripcion}
        inputMode="numeric"
        autoComplete="off"
        disabled={deshabilitada}
        value={texto}
        className={`${CIFRA} ${chica ? "text-2xl" : "text-4xl"}`}
        {...eventos}
      />
      <button type="button" tabIndex={-1} aria-label={`Bajar ${minusculaInicial(nombre)}`} disabled={deshabilitada} onClick={alBajar} className={FLECHA}>▼</button>
    </div>
  );
}
