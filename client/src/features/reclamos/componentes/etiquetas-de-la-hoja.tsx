import { type EstadoDeHoja, type Motivo, NOMBRE_DEL_MOTIVO, type TipoDeHoja } from "../servicios/reclamos";

const ESTADO: Record<EstadoDeHoja, [string, string]> = {
  NUEVA: ["Nueva", "bg-[#e6eefb] text-[#1d4fa3]"],
  EN_ATENCION: ["En atención", "bg-[#fbf1dc] text-[#7a4d00]"],
  RESPONDIDA: ["Respondida", "bg-[#e3f2e8] text-[#1f7a4d]"],
};

/** Estado de la hoja; una por responder con el plazo vencido dice «Vencida». */
export function EtiquetaDeEstado({ estado, vencida }: { estado: EstadoDeHoja; vencida: boolean }) {
  const [texto, color] = vencida ? ["Vencida", "bg-error-fondo text-error"] : ESTADO[estado];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${color}`}>{texto}</span>;
}

/** Tipo y motivo; sin motivo, lo dice para que se clasifique. */
export function TipoYMotivo({ tipo, motivo }: { tipo: TipoDeHoja; motivo: Motivo | null }) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-md border px-1.5 py-0.5 font-extrabold tracking-wide uppercase ${tipo === "QUEJA" ? "border-[#d9cdea] text-[#6b3fa0]" : "border-linea text-grava"}`}>
        {tipo === "QUEJA" ? "Queja" : "Reclamo"}
      </span>
      {motivo ? <span className="text-grava">{NOMBRE_DEL_MOTIVO[motivo]}</span> : <span className="font-semibold text-[#7a4d00]">Sin clasificar</span>}
    </span>
  );
}
