import { TARJETA } from "@/compartido/ui/estilos";
import type { PlazoDeCancelacion } from "../servicios/reservas";
import { textoDelPlazo } from "../utilidades/textos-de-la-reserva";

/** La regla de cancelación del turno, con fecha y hora en cada plazo, antes de comprometerse. */
export function PlazosDeCancelacion({ plazos, nota }: { plazos: PlazoDeCancelacion[]; nota: string }) {
  return (
    <section aria-labelledby="titulo-plazos" className={TARJETA}>
      <h2 id="titulo-plazos" className="font-titular text-3xl font-black text-cancha">Si cancelas</h2>
      <p className="mt-1 text-sm text-grava">{nota}</p>
      <ol className="plazos-de-cancelacion mt-4">
        {plazos.map((plazo) => {
          const { cuando, que } = textoDelPlazo(plazo);
          return (
            <li key={plazo.hasta} data-devuelve={plazo.porcentaje > 0 ? "" : undefined}>
              <span className="font-bold">{cuando}</span>
              <span className="text-grava">{que}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm text-grava">
        Lo que pagues por encima del adelanto se devuelve siempre.{" "}
        <a href="/legal/cancelaciones" target="_blank" rel="noopener" className="font-bold text-botella underline underline-offset-2">
          Política completa
        </a>
      </p>
    </section>
  );
}
