import type { Caracteristica } from "../servicios/canchas";
import type { CanchaPropuesta } from "../utilidades/preparar-alta";
import { PlantaDeCancha } from "./planta-de-cancha";

interface PreviaDelAltaProps {
  canchas: Pick<CanchaPropuesta, "clave" | "tipo" | "nombre">[];
  tieneIluminacion: boolean | null;
  caracteristicas: Caracteristica[];
  /** Texto cuando aún no hay nada que mostrar. */
  vacia: string;
}

const textoDeLuz = (luz: boolean | null) => (luz === null ? "luz por elegir" : luz ? "con luz" : "solo de día");

/** Cómo quedarán las canchas, dibujadas mientras se llena el alta. */
export function PreviaDelAlta({ canchas, tieneIluminacion, caracteristicas, vacia }: PreviaDelAltaProps) {
  return (
    <aside aria-labelledby="titulo-previa-del-alta" className="previa-del-alta">
      <h3 id="titulo-previa-del-alta" className="font-titular text-2xl leading-none font-black">Así quedarán</h3>
      {canchas.length === 0 ? (
        <p className="text-sm text-tiza/80">{vacia}</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2.5">
          {canchas.map((cancha) => (
            <li key={cancha.clave} className="previa-del-alta__cancha">
              <PlantaDeCancha tipo={cancha.tipo} tieneIluminacion={tieneIluminacion !== false} juntoALaPared={caracteristicas.includes("JUNTO_A_LA_PARED")} className="h-16" />
              <span className="block px-2.5 py-1.5 text-sm font-bold break-words">
                {cancha.nombre || "Sin nombre"}
                <small className="block font-semibold opacity-70">
                  Fútbol {cancha.tipo === "FUTBOL_5" ? 5 : 7} · {textoDeLuz(tieneIluminacion)}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-tiza/80">El jugador verá el tamaño, la luz y cómo es cada cancha antes de reservar.</p>
    </aside>
  );
}
