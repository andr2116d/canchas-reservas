import Link from "next/link";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";

/** Pie con el lugar y el acceso del personal, que entra por la misma pantalla. */
export function PieDeLaPortada() {
  return (
    <footer className="bg-cancha text-tiza/80">
      <div className="mx-auto flex w-[min(72rem,calc(100%-2rem))] flex-wrap justify-between gap-3 py-8 text-sm">
        <p>La Previa · Fútbol 5 y 7 en Trujillo, La Libertad</p>
        <Link href={RUTA_DE_ACCESO} className="font-semibold text-tiza underline underline-offset-4">¿Trabajas en La Previa? Ingresa aquí</Link>
      </div>
    </footer>
  );
}
