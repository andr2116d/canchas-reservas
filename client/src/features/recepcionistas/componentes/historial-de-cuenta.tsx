import type { AccionAuditada, AccionDelHistorial } from "../servicios/ficha-de-recepcionista";

const NOMBRE_DE_LA_ACCION: Record<AccionAuditada, string> = {
  ALTA: "Alta de la cuenta",
  EDICION: "Edición de datos",
  DESACTIVACION: "Desactivación",
  REACTIVACION: "Reactivación",
  RESTABLECIMIENTO_DE_CONTRASENA: "Restablecimiento de contraseña",
};

// La hora del local, sin depender del huso horario de quien mira la pantalla.
const FECHA_EN_LIMA = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Acciones de la auditoría sobre la cuenta, de la más reciente a la más antigua. */
export function HistorialDeCuenta({ historial }: { historial: AccionDelHistorial[] }) {
  return (
    <ol className="flex flex-col gap-4 border-l-2 border-linea pl-4">
      {historial.map((registro) => (
        <li key={`${registro.accion}-${registro.ocurridoEn}`} className="flex flex-col">
          <span className="font-bold text-tinta">{NOMBRE_DE_LA_ACCION[registro.accion]}</span>
          <span className="text-sm text-grava">
            <time dateTime={registro.ocurridoEn}>{FECHA_EN_LIMA.format(new Date(registro.ocurridoEn)).replace(".", "")}</time>
            {" · "}por {registro.ejecutadoPor}
          </span>
        </li>
      ))}
    </ol>
  );
}
