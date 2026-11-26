"use client";

import { NOMBRE_DEL_TIPO, TIPOS_DE_CANCHA, type TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import { type AltaEnGrupo, type CanchaPropuesta, MAXIMO_POR_TIPO } from "../utilidades/preparar-alta";

interface ContadorProps {
  tipo: TipoDeCancha;
  cantidad: number;
  alCambiar: (cantidad: number) => void;
}

function Contador({ tipo, cantidad, alCambiar }: ContadorProps) {
  const nombre = NOMBRE_DEL_TIPO[tipo];
  return (
    <div className="contador-de-canchas">
      <span className="font-bold">{nombre}</span>
      <span className="flex items-center gap-1">
        <button type="button" aria-label={`Una menos de ${nombre.toLowerCase()}`} disabled={cantidad === 0} onClick={() => alCambiar(cantidad - 1)}>−</button>
        <span aria-live="polite" className="cantidad-de-canchas">{cantidad}</span>
        <button type="button" aria-label={`Una más de ${nombre.toLowerCase()}`} disabled={cantidad === MAXIMO_POR_TIPO} onClick={() => alCambiar(cantidad + 1)}>+</button>
      </span>
    </div>
  );
}

/** Cuántas canchas de cada tamaño se agregan. */
export function ContadoresDeCanchas({ grupo, alCambiar, error }: { grupo: AltaEnGrupo; alCambiar: (cantidad: AltaEnGrupo["cantidad"]) => void; error?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {TIPOS_DE_CANCHA.map((tipo) => (
        <Contador key={tipo} tipo={tipo} cantidad={grupo.cantidad[tipo]} alCambiar={(cantidad) => alCambiar({ ...grupo.cantidad, [tipo]: cantidad })} />
      ))}
      <p aria-live="polite" className="text-sm font-medium text-error empty:hidden">{error}</p>
    </div>
  );
}

interface NombresPropuestosProps {
  propuestas: CanchaPropuesta[];
  errores: Record<string, string>;
  alCambiar: (clave: string, nombre: string) => void;
}

/** Nombre de cada cancha del grupo: viene propuesto y se cambia tocándolo. */
export function NombresPropuestos({ propuestas, errores, alCambiar }: NombresPropuestosProps) {
  const conError = propuestas.filter((p) => errores[`nombre-${p.clave}`]);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-grava">Se proponen solos. Toca uno para cambiarlo.</p>
      <div className="flex flex-wrap gap-1.5">
        {propuestas.map((propuesta) => (
          <input
            key={propuesta.clave}
            id={`nombre-${propuesta.clave}`}
            aria-label={propuesta.etiqueta}
            aria-invalid={Boolean(errores[`nombre-${propuesta.clave}`])}
            value={propuesta.nombre}
            maxLength={40}
            autoComplete="off"
            onChange={(evento) => alCambiar(propuesta.clave, evento.target.value)}
            className="nombre-propuesto"
          />
        ))}
      </div>
      <ul aria-live="polite" className="text-sm font-medium text-error empty:hidden">
        {conError.map((p) => (
          <li key={p.clave}>
            <b>{p.nombre || "Sin nombre"}:</b> <span>{errores[`nombre-${p.clave}`]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
