"use client";

import { NOMBRE_DEL_TIPO, TIPOS_DE_CANCHA, type TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import { CARACTERISTICAS, type Caracteristica } from "../servicios/canchas";

interface SegmentoProps<T> {
  etiqueta: string;
  opciones: { valor: T; texto: string }[];
  valor: T | null;
  alElegir: (valor: T) => void;
  error?: string;
  ayuda?: string;
}

/** Elección de una opción entre pocas, con botones que muestran cuál está elegida. */
export function Segmento<T extends string | boolean>({ etiqueta, opciones, valor, alElegir, error, ayuda }: SegmentoProps<T>) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-tinta">
        {etiqueta}
        <span aria-hidden="true" className="ml-0.5 text-error">*</span>
      </legend>
      <div className={`segmento-de-cancha ${error ? "segmento-de-cancha--invalido" : ""}`}>
        {opciones.map((opcion) => (
          <button key={String(opcion.valor)} type="button" aria-pressed={valor === opcion.valor} onClick={() => alElegir(opcion.valor)}>
            {opcion.texto}
          </button>
        ))}
      </div>
      {ayuda && <p className="max-w-80 text-sm text-grava">{ayuda}</p>}
      <p aria-live="polite" className="text-sm font-medium text-error empty:hidden">{error}</p>
    </fieldset>
  );
}

const OPCIONES_DE_TAMANO = TIPOS_DE_CANCHA.map((valor) => ({ valor, texto: NOMBRE_DEL_TIPO[valor] }));
const OPCIONES_DE_LUZ = [
  { valor: true, texto: "Con luz" },
  { valor: false, texto: "Sin luz" },
];

export function SelectorDeTamano(props: Omit<SegmentoProps<TipoDeCancha>, "etiqueta" | "opciones">) {
  return <Segmento etiqueta="Tamaño" opciones={OPCIONES_DE_TAMANO} {...props} />;
}

/** Sin luz, la cancha solo ofrece turnos de día; se avisa al elegirlo. */
export function SelectorDeLuz(props: Omit<SegmentoProps<boolean>, "etiqueta" | "opciones" | "ayuda">) {
  const ayuda = props.valor === false ? "Sin luz solo se ofrecen turnos de día, antes de la hora de noche." : undefined;
  return <Segmento etiqueta="Iluminación para la noche" opciones={OPCIONES_DE_LUZ} ayuda={ayuda} {...props} />;
}

interface SelectorDeDetallesProps {
  elegidos: Caracteristica[];
  alCambiar: (elegidos: Caracteristica[]) => void;
}

/** Detalles de la lista fija que se marcan y desmarcan con un toque. */
export function SelectorDeDetalles({ elegidos, alCambiar }: SelectorDeDetallesProps) {
  const alternar = (valor: Caracteristica) =>
    alCambiar(elegidos.includes(valor) ? elegidos.filter((v) => v !== valor) : CARACTERISTICAS.map((c) => c.valor).filter((v) => v === valor || elegidos.includes(v)));
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-tinta">
        Cómo es <span className="font-normal text-grava">(opcional)</span>
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {CARACTERISTICAS.map(({ valor, texto }) => (
          <button key={valor} type="button" aria-pressed={elegidos.includes(valor)} onClick={() => alternar(valor)} className="detalle-de-cancha">
            {texto}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface CampoDelNombreProps {
  id: string;
  valor: string;
  alEscribir: (valor: string) => void;
  error?: string;
  ayuda?: string;
}

/** Campo del nombre de la cancha con su error junto a él. */
export function CampoDelNombre({ id, valor, alEscribir, error, ayuda }: CampoDelNombreProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-tinta">
        Nombre<span aria-hidden="true" className="ml-0.5 text-error">*</span>
      </label>
      <input
        id={id}
        value={valor}
        maxLength={40}
        required
        autoComplete="off"
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-error`}
        onChange={(evento) => alEscribir(evento.target.value)}
        className="campo-de-cancha w-full max-w-64"
      />
      {ayuda && <p className="text-sm text-grava">{ayuda}</p>}
      <p id={`${id}-error`} aria-live="polite" className="text-sm font-medium text-error empty:hidden">{error}</p>
    </div>
  );
}
