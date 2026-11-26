import Image from "next/image";
import { NOMBRE_DEL_TIPO } from "@/compartido/canchas/tipo-de-cancha";
import type { ClubPublico, TarifaDelClub } from "@/compartido/club/servicios/club";
import { JUGADORES, precioPorPersona } from "@/compartido/club/utilidades/precio-por-persona";
import fotoDeDia from "../../../../public/imagenes/fulbito-dia.jpg";
import fotoDeNoche from "../../../../public/imagenes/reflectores.jpg";

const horas = (n: number) => (n === 1 ? "turno de 1 h" : `turno de ${n} h`);

function Franja({ titulo, detalle, foto, tarifas, precio }: { titulo: string; detalle: string; foto: typeof fotoDeDia; tarifas: TarifaDelClub[]; precio: "precioDia" | "precioNoche" }) {
  return (
    <article aria-labelledby={`franja-${precio}`} className="franja-de-precio">
      <Image src={foto} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="franja-de-precio__foto" />
      <div className="flex flex-col gap-4 p-6">
        <header>
          <h3 id={`franja-${precio}`} className="font-titular text-4xl leading-none font-black text-papel">{titulo}</h3>
          <p className="mt-1 text-tiza/80">{detalle}</p>
        </header>
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2.5">
          {tarifas.map((t) => (
            <div key={t.tipo} className="franja-de-precio__tarifa">
              <dt className="text-sm text-tiza/80">{NOMBRE_DEL_TIPO[t.tipo]} · {horas(t.duracionDelTurnoHoras)}</dt>
              <dd className="font-titular text-4xl leading-none font-black text-capitan tabular-nums">S/ {t[precio]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

/** Precio de un turno de día y de noche por tipo de cancha, con lo que pone cada uno. */
export function PreciosDelClub({ tarifas, horario, adelanto }: Pick<ClubPublico, "tarifas" | "horario" | "adelanto">) {
  if (tarifas.length === 0) return <p className="text-grava">Pronto publicaremos nuestros precios.</p>;
  const noches = [...new Set(horario?.dias.map((d) => d.inicioDeLaNoche))];
  const noche = noches.length === 1 ? `Desde las ${noches[0]}` : "Desde la hora de noche de cada día";
  const ejemplo = tarifas[0];
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Franja titulo="Con luz natural" detalle={`Turnos que terminan antes de la noche. ${noche.replace("Desde", "La noche empieza")}.`} foto={fotoDeDia} tarifas={tarifas} precio="precioDia" />
        <Franja titulo="Bajo los reflectores" detalle={`${noche}, en las canchas con luz.`} foto={fotoDeNoche} tarifas={tarifas} precio="precioNoche" />
      </div>
      <ul className="flex flex-wrap gap-x-8 gap-y-2 text-grava">
        <li>Entre {JUGADORES[ejemplo.tipo]}, un turno de {NOMBRE_DEL_TIPO[ejemplo.tipo].toLowerCase()} de noche sale a <strong className="text-tinta tabular-nums">S/ {precioPorPersona(ejemplo.precioNoche, ejemplo.tipo)}</strong> por persona.</li>
        {adelanto && <li>Lo separas con el <strong className="text-tinta">{adelanto} %</strong> de adelanto o pagas el total.</li>}
        <li>Un turno que empieza de día y termina de noche se cobra en proporción.</li>
      </ul>
    </div>
  );
}
