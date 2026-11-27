import Link from "next/link";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO, TARJETA } from "@/compartido/ui/estilos";
import { enSoles } from "@/compartido/ui/textos-del-local";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import type { ResumenDeReserva } from "../servicios/reservas";
import { saldoEnElLocal } from "../utilidades/textos-de-la-reserva";

interface TotalDeLaReservaProps {
  resumen: ResumenDeReserva;
  enviando: boolean;
  aviso?: string;
  separar: () => void;
}

/** Cuánto cuesta, con cuánto se confirma y qué queda para el local; y el botón que separa. */
export function TotalDeLaReserva({ resumen, enviando, aviso, separar }: TotalDeLaReservaProps) {
  const { precio, adelanto, porcentajeDeAdelanto, minutosDeRetencion, cancha, desde, hasta } = resumen;
  return (
    <section aria-labelledby="titulo-total" className={`${TARJETA} total-de-la-reserva flex flex-col gap-4`}>
      <div>
        <h2 id="titulo-total" className="text-sm font-bold text-grava">Precio final, con IGV</h2>
        <p className="font-titular text-6xl leading-none font-black text-cancha tabular-nums">{enSoles(precio)}</p>
      </div>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-grava">Adelanto para confirmarla ({porcentajeDeAdelanto} %)</dt><dd className="font-bold tabular-nums">{enSoles(adelanto)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-grava">El resto, en el local</dt><dd className="font-bold tabular-nums">{enSoles(saldoEnElLocal(precio, adelanto))}</dd></div>
      </dl>
      <p className="rounded-xl bg-tiza px-3 py-2.5 text-sm">
        Al separarlo, el turno queda guardado <strong>{minutosDeRetencion} minutos</strong>. Hoy no se cobra nada: el pago en línea llega pronto.
      </p>
      <div aria-live="polite"><ErrorGeneral mensaje={aviso} /></div>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={separar} disabled={enviando} className={BOTON_PRINCIPAL}>
          <TextoDeEnvio enviando={enviando} texto={`Separar ${cancha.nombre} · ${desde}–${hasta}`} textoAlEnviar="Separando tu turno…" />
        </button>
        <Link href="/inicio/reservar" className={BOTON_SECUNDARIO}>Elegir otro turno</Link>
      </div>
    </section>
  );
}
