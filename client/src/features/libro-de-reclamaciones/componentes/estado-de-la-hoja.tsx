import type { ReactNode } from "react";
import { diaLegible, type EstadoDeHoja, fechaCorta, fechaYHora, NOMBRE_DEL_ESTADO, NOMBRE_DEL_MEDIO, NOMBRE_DEL_SERVICIO, NOMBRE_DEL_TIPO, type Seguimiento } from "../servicios/libro";

const COLOR_DEL_ESTADO: Record<EstadoDeHoja, string> = {
  NUEVA: "bg-[#e6eefb] text-[#1d4fa3]",
  EN_ATENCION: "bg-[#fbf1dc] text-[#7a4d00]",
  RESPONDIDA: "bg-[#e3f2e8] text-[#1f7a4d]",
};

/** Etiqueta del estado de una hoja, con su color. */
export function EtiquetaDeEstado({ estado }: { estado: EstadoDeHoja }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${COLOR_DEL_ESTADO[estado]}`}>{NOMBRE_DEL_ESTADO[estado]}</span>;
}

function Hito({ hecho, actual, titulo, children }: { hecho: boolean; actual?: boolean; titulo: string; children: ReactNode }) {
  return (
    <li aria-current={actual ? "step" : undefined} className="relative grid grid-cols-[1.75rem_1fr] gap-3 pb-5 last:pb-0 before:absolute before:top-7 before:bottom-0 before:left-[0.8rem] before:w-0.5 before:bg-linea last:before:hidden">
      <span aria-hidden="true" className={`z-10 grid size-7 place-items-center rounded-full text-sm font-black ${hecho ? "bg-botella text-papel" : actual ? "bg-capitan text-tinta" : "bg-linea text-papel"}`}>
        {hecho ? "✓" : "•"}
      </span>
      <div className="min-w-0">
        <strong className="block text-tinta">{titulo}</strong>
        <div className="text-sm text-grava">{children}</div>
      </div>
    </li>
  );
}

function Plazo({ hoja }: { hoja: Seguimiento }) {
  if (hoja.respuesta) return <p className="text-sm text-grava">Respondida el {fechaYHora(hoja.respuesta.respondidaEn)}.</p>;
  const quedan = hoja.diasHabilesRestantes ?? 0;
  return (
    <p className="text-sm text-grava">
      Te respondemos a más tardar el <b className="text-tinta">{diaLegible(hoja.fechaLimite)}</b>
      {quedan >= 0 ? ` · quedan ${quedan} ${quedan === 1 ? "día hábil" : "días hábiles"}.` : "."}
    </p>
  );
}

/** El estado de una hoja: plazo, línea de tiempo, respuesta y lo que se registró. */
export function EstadoDeLaHoja({ hoja }: { hoja: Seguimiento }) {
  const { respuesta } = hoja;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-linea px-2 py-0.5 text-xs font-extrabold tracking-wide text-grava uppercase">{NOMBRE_DEL_TIPO[hoja.tipo]}</span>
          <EtiquetaDeEstado estado={hoja.estado} />
        </div>
        <h2 className="font-titular text-3xl leading-none font-black text-cancha tabular-nums">Hoja {hoja.numero}</h2>
        <Plazo hoja={hoja} />
      </div>
      <ol aria-label="Avance de la hoja">
        <Hito hecho titulo="Recibida">{fechaYHora(hoja.registradaEn)}</Hito>
        <Hito hecho={Boolean(hoja.abiertaEn)} actual={hoja.estado === "NUEVA"} titulo="En atención">
          {hoja.abiertaEn ? `${fechaYHora(hoja.abiertaEn)} · La Previa está revisando tu caso.` : "Pronto la revisará La Previa."}
        </Hito>
        <Hito hecho={Boolean(respuesta)} actual={hoja.estado === "EN_ATENCION"} titulo="Respondida">
          {respuesta ? (
            <>
              <span>{respuesta.cartaEnviadaEl ? `Carta enviada el ${fechaCorta(respuesta.cartaEnviadaEl)}.` : `Enviada ${NOMBRE_DEL_MEDIO[hoja.medioDeRespuesta]}.`}</span>
              <span className="mt-2 block rounded-xl bg-tiza px-4 py-3 whitespace-pre-line text-tinta">{respuesta.texto}</span>
            </>
          ) : (
            `Llegará ${NOMBRE_DEL_MEDIO[hoja.medioDeRespuesta]} y la verás aquí.`
          )}
        </Hito>
      </ol>
      <details className="rounded-xl border border-linea">
        <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-botella">Lo que registraste</summary>
        <dl className="flex flex-col gap-2 px-4 pb-4 text-sm">
          <div><dt className="text-grava">Servicio</dt><dd>{NOMBRE_DEL_SERVICIO[hoja.servicio.servicio]}{hoja.servicio.montoReclamado && ` · S/ ${hoja.servicio.montoReclamado}`}</dd></div>
          <div><dt className="text-grava">Qué pasó</dt><dd className="whitespace-pre-line">{hoja.detalle}</dd></div>
          <div><dt className="text-grava">Qué pediste</dt><dd className="whitespace-pre-line">{hoja.pedido}</dd></div>
        </dl>
      </details>
    </div>
  );
}
