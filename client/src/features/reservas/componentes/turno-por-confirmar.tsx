import Link from "next/link";
import { NOMBRE_DEL_TIPO } from "@/compartido/canchas/tipo-de-cancha";
import { diaLargo } from "@/compartido/ui/textos-del-local";
import type { CanchaDeLaReserva } from "../servicios/reservas";

interface TurnoPorConfirmarProps {
  cancha: CanchaDeLaReserva;
  fecha: string;
  desde: string;
  hasta: string;
  /** Lleva de vuelta al mapa para elegir otro turno. */
  cambiar?: boolean;
}

/** El turno en grande, sobre el verde de la cancha: dónde, qué día y a qué hora. */
export function TurnoPorConfirmar({ cancha, fecha, desde, hasta, cambiar = false }: TurnoPorConfirmarProps) {
  const etiquetas = [NOMBRE_DEL_TIPO[cancha.tipo], cancha.tieneIluminacion ? "Con luz" : "Solo con luz natural"];
  return (
    <section aria-label="Tu turno" className="turno-por-confirmar flex flex-col gap-3 rounded-2xl p-5 text-papel shadow-sm sm:p-7">
      <p className="text-xs font-bold tracking-[0.18em] text-capitan uppercase">Tu turno</p>
      <div>
        <h2 className="font-titular text-4xl leading-none font-black">{cancha.nombre}</h2>
        <p className="font-titular text-5xl leading-none font-black text-capitan tabular-nums sm:text-6xl">
          {desde}–{hasta}
        </p>
      </div>
      <p className="text-lg font-semibold first-letter:uppercase">{diaLargo(fecha)}</p>
      <ul className="flex flex-wrap gap-2" aria-label="Cómo es la cancha">
        {etiquetas.map((etiqueta) => (
          <li key={etiqueta} className="rounded-full bg-white/12 px-3 py-1 text-sm font-semibold">{etiqueta}</li>
        ))}
      </ul>
      {cambiar && (
        <Link href="/inicio/reservar" className="w-fit text-sm font-bold text-capitan underline underline-offset-4">
          Cambiar de turno
        </Link>
      )}
    </section>
  );
}
