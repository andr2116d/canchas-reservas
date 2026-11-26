import Link from "next/link";
import { MonogramaLaPrevia } from "@/compartido/ui/monograma-la-previa";

const FOCO_CAPITAN = "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-capitan";

/** Marca de La Previa y enlace directo para volver a la portada desde acceso y registro. */
export function RetornoAPortada({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 ${className}`.trim()}>
      <Link href="/" aria-label="La Previa, ir a la portada" className={`flex items-center gap-3 text-capitan ${FOCO_CAPITAN}`}>
        <MonogramaLaPrevia className="h-9 w-auto shrink-0" aria-hidden="true" />
        <span className="font-titular text-2xl font-black tracking-wide">La Previa</span>
      </Link>
      <Link href="/" className={`inline-flex min-h-11 items-center text-sm font-bold text-tiza/85 underline underline-offset-4 transition-colors hover:text-capitan ${FOCO_CAPITAN}`}>
        Volver a la portada
      </Link>
    </div>
  );
}
