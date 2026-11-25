import Link from "next/link";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { diaLegible, fechaYHora, NOMBRE_DEL_TIPO, type ResumenDeHoja } from "../servicios/libro";
import { EtiquetaDeEstado } from "./estado-de-la-hoja";

function PieDeLaHoja({ hoja }: { hoja: ResumenDeHoja }) {
  if (hoja.estado === "RESPONDIDA") return <span>Respondida · mira la respuesta</span>;
  return <span>Respuesta a más tardar el {diaLegible(hoja.fechaLimite)}</span>;
}

/** «Mis reclamos»: cada hoja con su estado; sin hojas, cómo registrar una. */
export function MisHojas({ hojas }: { hojas: ResumenDeHoja[] }) {
  if (hojas.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-white/80 bg-papel p-6">
        <p className="text-tinta">No registraste hojas con tu cuenta.</p>
        <Link href="/libro-de-reclamaciones" className={BOTON_PRINCIPAL}>Registrar un reclamo o queja</Link>
      </div>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {hojas.map((hoja) => (
        <li key={hoja.numero}>
          <Link href={`/inicio/reclamos/${hoja.numero}`} className="flex h-full flex-col gap-2 rounded-2xl border border-white/80 bg-papel p-5 shadow-sm transition-colors hover:border-botella/40 focus-visible:outline-2 focus-visible:outline-botella">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold tracking-wide text-grava uppercase">{NOMBRE_DEL_TIPO[hoja.tipo]}</span>
              <EtiquetaDeEstado estado={hoja.estado} />
            </span>
            <span className="font-titular text-2xl leading-none font-black text-cancha tabular-nums">{hoja.numero}</span>
            <span className="line-clamp-2 text-sm text-grava">{hoja.resumen}</span>
            <span className="mt-auto flex flex-wrap justify-between gap-2 pt-2 text-xs text-grava">
              <span>{fechaYHora(hoja.registradaEn)}</span>
              <PieDeLaHoja hoja={hoja} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
