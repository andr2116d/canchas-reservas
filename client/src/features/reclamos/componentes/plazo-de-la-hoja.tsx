import type { FilaDeHoja } from "../servicios/reclamos";

type Plazo = Pick<FilaDeHoja, "estado" | "diasHabilesRestantes" | "vencida" | "fueraDePlazo" | "respondidaEn">;

const DIAS_DEL_PLAZO = 15;
const FECHA = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" });

function texto({ estado, diasHabilesRestantes: quedan, vencida, fueraDePlazo, respondidaEn }: Plazo): string {
  if (estado === "RESPONDIDA") return `Respondida el ${FECHA.format(new Date(respondidaEn!))}${fueraDePlazo ? " · fuera de plazo" : ""}`;
  if (vencida) return `Vencida hace ${-quedan!} ${quedan === -1 ? "día hábil" : "días hábiles"}`;
  if (quedan === 0) return "Vence hoy";
  return `Quedan ${quedan} ${quedan === 1 ? "día hábil" : "días hábiles"}`;
}

function nivel({ estado, diasHabilesRestantes: quedan, vencida, fueraDePlazo }: Plazo) {
  if (estado === "RESPONDIDA") return fueraDePlazo ? "text-error" : "text-grava";
  if (vencida) return "text-error";
  return (quedan ?? 0) <= 3 ? "text-[#7a4d00]" : "text-[#1f7a4d]";
}

const COLOR_DE_LA_BARRA: Record<string, string> = { "text-error": "bg-error", "text-[#7a4d00]": "bg-alerta", "text-[#1f7a4d]": "bg-[#1f7a4d]", "text-grava": "bg-linea" };

/** Cuánto queda del plazo legal: verde, ámbar con 3 días o menos, rojo si venció. */
export function PlazoDeLaHoja({ plazo }: { plazo: Plazo }) {
  const color = nivel(plazo);
  const usados = plazo.estado === "RESPONDIDA" ? DIAS_DEL_PLAZO : DIAS_DEL_PLAZO - (plazo.diasHabilesRestantes ?? 0);
  const ancho = Math.min(100, Math.max(6, (usados / DIAS_DEL_PLAZO) * 100));
  return (
    <div className="flex flex-col gap-1.5">
      <span className={`text-sm font-bold ${color}`}>{texto(plazo)}</span>
      <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-linea/70">
        <span className={`block h-full rounded-full ${COLOR_DE_LA_BARRA[color]}`} style={{ width: `${ancho}%` }} />
      </span>
    </div>
  );
}
