import { type CambioDeLaHoja, type Motivo, NOMBRE_DEL_MOTIVO } from "../servicios/reclamos";

const FECHA = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

function frase({ accion, detalle }: CambioDeLaHoja): string {
  if (accion === "APERTURA") return "La abrió: pasó a «en atención».";
  if (accion === "CAMBIO_DE_TIPO") return "La pasó de queja a reclamo.";
  if (accion === "CLASIFICACION") return `La clasificó como «${NOMBRE_DEL_MOTIVO[detalle?.despues as Motivo] ?? "otro"}».`;
  return `La respondió por ${detalle?.medio === "CARTA" ? "carta" : "correo"}${detalle?.fueraDePlazo ? ", fuera de plazo" : ""}.`;
}

/** Quién hizo qué con la hoja y cuándo. También queda en el historial de cambios. */
export function RegistroDeLaHoja({ cambios, registradaEn }: { cambios: CambioDeLaHoja[]; registradaEn: string }) {
  return (
    <ol className="flex flex-col gap-2 text-sm">
      <li className="flex flex-wrap gap-x-2">
        <time className="text-grava tabular-nums">{FECHA.format(new Date(registradaEn))}</time>
        <span>Se registró la hoja.</span>
      </li>
      {cambios.map((cambio, i) => (
        <li key={i} className="flex flex-wrap gap-x-2">
          <time className="text-grava tabular-nums">{FECHA.format(new Date(cambio.ocurridoEn))}</time>
          <span><b className="font-semibold">{cambio.ejecutadoPor}</b> · {frase(cambio)}</span>
        </li>
      ))}
    </ol>
  );
}
