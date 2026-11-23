import Link from "next/link";
import {
  type EstadoDelListado,
  type FichaDeRecepcionista,
  NOMBRE_DEL_DOCUMENTO,
} from "../servicios/ficha-de-recepcionista";
import { TARJETA } from "@/compartido/ui/estilos";
import { AccionesRapidas } from "./acciones-rapidas";

const RUTA = "/administracion/recepcionistas";
const PESTANAS: { estado: EstadoDelListado; texto: string; ruta: string }[] = [
  { estado: "activas", texto: "Cuentas activas", ruta: RUTA },
  {
    estado: "desactivadas",
    texto: "Cuentas desactivadas",
    ruta: `${RUTA}?estado=desactivadas`,
  },
];
const SIN_CUENTAS: Record<EstadoDelListado, string> = {
  activas: "Todavía no hay cuentas de recepción activas.",
  desactivadas: "No hay cuentas desactivadas.",
};

function PestanasDeEstado({ estado }: { estado: EstadoDelListado }) {
  return (
    <nav
      aria-label="Estado de las cuentas"
      className="flex w-fit gap-1 rounded-xl bg-linea/60 p-1"
    >
      {PESTANAS.map((pestana) => (
        <Link
          key={pestana.estado}
          href={pestana.ruta}
          aria-current={pestana.estado === estado ? "page" : undefined}
          className="rounded-lg px-4 py-2 text-sm font-bold text-grava aria-[current=page]:bg-papel aria-[current=page]:text-botella aria-[current=page]:shadow-sm"
        >
          {pestana.texto}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Tarjeta de una recepcionista: toda la tarjeta abre su ficha (el nombre es el
 * enlace y su área se estira a la tarjeta); las acciones van encima, aparte.
 */
function FilaDeRecepcionista({ ficha }: { ficha: FichaDeRecepcionista }) {
  return (
    <li className="group relative flex flex-col gap-4 rounded-2xl border border-linea bg-papel p-4 transition-[border-color,box-shadow] hover:border-botella/40 hover:shadow-md has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-botella sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <Link
            href={`${RUTA}/${ficha.id}`}
            className="text-lg font-bold text-tinta outline-none group-hover:text-botella after:absolute after:inset-0 after:rounded-2xl after:content-['']"
          >
            {ficha.nombres} {ficha.apellidos}
          </Link>
          <p className="text-sm break-all text-grava">{ficha.correo}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-grava">
          <span>{NOMBRE_DEL_DOCUMENTO[ficha.tipoDocumento]} {ficha.numeroDocumento}</span>
          <span>{ficha.celular}</span>
          {ficha.requiereCambiarContrasena && (
            <span className="rounded-full bg-[#fff6dc] px-2.5 py-0.5 text-xs font-bold text-alerta">Contraseña temporal</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative z-10">
          <AccionesRapidas ficha={ficha} />
        </div>
        <span aria-hidden="true" className="inline-flex items-center gap-1 text-sm font-bold text-botella">
          Ver ficha
          <svg viewBox="0 0 16 16" className="size-4 transition-transform group-hover:translate-x-0.5" focusable="false">
            <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </li>
  );
}

/** Recepcionistas activas o desactivadas, con pestañas para cambiar de estado. */
export function ListadoDeRecepcionistas({
  estado,
  fichas,
}: {
  estado: EstadoDelListado;
  fichas: FichaDeRecepcionista[];
}) {
  return (
    <section className={`${TARJETA} flex flex-col gap-4`}>
      <PestanasDeEstado estado={estado} />
      <div>
        {fichas.length === 0 ? (
          <p className="text-grava">{SIN_CUENTAS[estado]}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {fichas.map((ficha) => (
              <FilaDeRecepcionista key={ficha.id} ficha={ficha} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
