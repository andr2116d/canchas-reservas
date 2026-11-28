import { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { celularLegible, diaLargo } from "@/compartido/ui/textos-del-local";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import type { ReservaFueraDeHorario } from "../servicios/horario.api";

interface ReservasFueraDeHorarioProps {
  reservas: readonly ReservaFueraDeHorario[];
  confirmando: boolean;
  alGuardarIgual: () => void;
  alRevisar: () => void;
}

const titulo = (cantidad: number) =>
  cantidad === 1 ? "1 reserva queda fuera del nuevo horario" : `${cantidad} reservas quedan fuera del nuevo horario`;

function Reserva({ reserva }: { reserva: ReservaFueraDeHorario }) {
  return (
    <li className="flex flex-col gap-0.5 rounded-xl bg-papel px-3.5 py-2.5 text-sm">
      <span className="font-semibold text-tinta first-letter:uppercase">{`${diaLargo(reserva.fecha)} · ${reserva.desde}–${reserva.hasta} · ${reserva.cancha}`}</span>
      <span className="flex flex-wrap gap-x-3 text-grava">
        <span className="text-tinta">{reserva.titular}</span>
        {reserva.celular && (
          <a href={`tel:+51${reserva.celular}`} className="text-botella tabular-nums underline-offset-4 hover:underline">
            {celularLegible(reserva.celular)}
          </a>
        )}
        <span>Reserva {reserva.codigo}</span>
      </span>
    </li>
  );
}

/** Las reservas por jugar que el horario nuevo deja fuera: se avisa a cada cliente y se decide. */
export function ReservasFueraDeHorario({ reservas, confirmando, alGuardarIgual, alRevisar }: ReservasFueraDeHorarioProps) {
  return (
    <section aria-labelledby="reservas-fuera-titulo" className="flex flex-col gap-3 rounded-2xl border border-[#e8c97a] bg-[#fdf6e3] p-4">
      <h3 id="reservas-fuera-titulo" className="font-titular text-2xl font-black text-[#7a4d00]">{titulo(reservas.length)}</h3>
      <p className="max-w-[60ch] text-sm text-tinta">No se anulan: el local las atiende igual. Avisa a cada cliente antes de guardar.</p>
      <ul className="flex flex-col gap-2">
        {reservas.map((reserva) => <Reserva key={reserva.codigo} reserva={reserva} />)}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={alGuardarIgual} disabled={confirmando} aria-busy={confirmando} className={BOTON_PRINCIPAL}>
          <TextoDeEnvio enviando={confirmando} texto="Guardar igual y respetar estas reservas" textoAlEnviar="Guardando…" />
        </button>
        <button type="button" onClick={alRevisar} className={BOTON_SECUNDARIO}>Revisar el horario</button>
      </div>
    </section>
  );
}
