import Link from "next/link";
import { AvisoLegalDelLibro } from "./aviso-legal-del-libro";

const PROMESAS = [
  ["Sin cuenta ni pago", "No necesitas registrarte ni haber pagado para reclamar."],
  ["Respuesta en 15 días hábiles", "Como máximo, contados desde el día siguiente."],
  ["Tu hoja con número y código", "Te llega una copia al correo y la sigues cuando quieras."],
] as const;

/** Lo esencial antes de llenar la hoja, sin distraer del formulario. */
export function LateralDelLibro() {
  return (
    <aside aria-label="Antes de llenar la hoja" className="flex flex-col gap-5 print:hidden">
      <ul className="flex flex-col gap-4">
        {PROMESAS.map(([titulo, detalle]) => (
          <li key={titulo} className="flex gap-3">
            <span aria-hidden="true" className="mt-1 size-2.5 shrink-0 rounded-full bg-botella" />
            <span>
              <strong className="block text-tinta">{titulo}</strong>
              <span className="text-sm text-grava">{detalle}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="rounded-xl bg-tiza px-4 py-3 text-sm text-tinta">
        ¿Ya registraste una hoja? <Link href="/libro-de-reclamaciones/seguimiento" className="font-bold text-botella underline underline-offset-2">Síguela aquí</Link>.
      </p>
      <AvisoLegalDelLibro />
    </aside>
  );
}
