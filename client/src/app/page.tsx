import Link from "next/link";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";

export default function Inicio() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <h1 className="font-titular text-5xl font-black">La Previa</h1>
      <Link href={RUTA_DE_ACCESO} className="mt-5 inline-block font-bold text-botella underline underline-offset-4">
        Inicia sesión
      </Link>
    </main>
  );
}
