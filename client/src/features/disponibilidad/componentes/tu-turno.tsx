import Link from "next/link";
import { NOMBRE_DEL_TIPO, type TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import type { CanchaDelMapa, TurnoDelMapa } from "../servicios/disponibilidad";
import { nombreLargo } from "../utilidades/fechas-de-la-tira";
import { enSoles } from "../utilidades/textos-del-mapa";

/** Quién mira el mapa: cambia lo que se puede hacer con el turno elegido. */
export type ContextoDelMapa = "publico" | "jugador" | "recepcion";

export interface TurnoParaMostrar {
  tipo: TipoDeCancha;
  turno: TurnoDelMapa;
  cancha: CanchaDelMapa;
}

interface TuTurnoProps {
  contexto: ContextoDelMapa;
  fecha: string;
  porcentaje: number | null;
  elegido?: TurnoParaMostrar;
  /** Por qué se quitó el turno elegido, como «ya no está libre». */
  aviso?: string;
  alCerrar: () => void;
}

function QueHacer({ contexto }: { contexto: ContextoDelMapa }) {
  if (contexto === "publico") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-grava">Para reservar necesitas tu cuenta de jugador.</p>
        <div className="flex flex-wrap gap-2">
          <Link href={RUTA_DE_ACCESO} className={BOTON_PRINCIPAL}>Ingresar para reservar</Link>
          <Link href="/registro" className={BOTON_SECUNDARIO}>Crear cuenta</Link>
        </div>
      </div>
    );
  }
  return <p className="rounded-xl bg-tiza px-3 py-2 text-sm text-grava">{contexto === "jugador" ? "Pronto podrás pagar el adelanto y separarlo desde aquí." : "Pronto podrás crear la reserva desde aquí."}</p>;
}

function Detalle({ fecha, porcentaje, elegido }: { fecha: string; porcentaje: number | null; elegido: TurnoParaMostrar }) {
  const { turno, cancha, tipo } = elegido;
  return (
    <>
      <h2 className="font-titular text-3xl leading-none font-black text-cancha">
        {cancha.nombre}
        <span className="block tabular-nums">{turno.desde}–{turno.hasta}</span>
      </h2>
      <dl className="grid gap-1.5 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-grava">Fecha</dt><dd className="font-semibold first-letter:uppercase">{nombreLargo(fecha)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-grava">Cancha</dt><dd className="font-semibold">{NOMBRE_DEL_TIPO[tipo]} · {cancha.tieneIluminacion ? "con luz" : "solo luz natural"}</dd></div>
      </dl>
      <div>
        <p className="font-titular text-5xl leading-none font-black text-cancha tabular-nums">{enSoles(turno.precio)}</p>
        <p className="text-sm text-grava">Precio final del turno, con IGV.</p>
      </div>
      <p className="rounded-xl bg-tiza px-3 py-2 text-sm">
        {turno.adelanto && porcentaje !== null ? (
          <>Lo separas con <strong className="tabular-nums">{enSoles(turno.adelanto)}</strong> de adelanto ({porcentaje} %) o pagando el total. El resto se paga en el local.</>
        ) : (
          "El adelanto para separarlo todavía no está definido."
        )}
      </p>
    </>
  );
}

/** El turno elegido con su precio y su adelanto: al costado del mapa o, en el celular, desde abajo. */
export function TuTurno({ contexto, fecha, porcentaje, elegido, aviso, alCerrar }: TuTurnoProps) {
  return (
    <aside aria-label="Tu turno" data-elegido={elegido ? "" : undefined} className="tu-turno flex flex-col gap-4 rounded-2xl border border-linea bg-papel p-5 shadow-sm">
      <div aria-live="polite" className="contents">
        {aviso && <p className="rounded-xl bg-[#fbf1dc] px-3 py-2 text-sm font-semibold text-[#7a4e00]">{aviso}</p>}
        {elegido ? (
          <Detalle fecha={fecha} porcentaje={porcentaje} elegido={elegido} />
        ) : (
          <>
            <h2 className="font-titular text-3xl font-black text-cancha">Tu turno</h2>
            <p className="text-sm text-grava">Toca un turno <strong className="text-botella">Libre</strong> para ver su precio y con cuánto se separa.</p>
          </>
        )}
      </div>
      {elegido && <QueHacer contexto={contexto} />}
      {elegido && <button type="button" onClick={alCerrar} className={`${BOTON_SECUNDARIO} lg:hidden`}>Cerrar</button>}
    </aside>
  );
}
