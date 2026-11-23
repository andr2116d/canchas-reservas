import type { Metadata } from "next";
import Link from "next/link";
import { ACCION_PRINCIPAL_DEL_AVISO, PantallaDeAviso } from "@/compartido/ui/pantalla-de-aviso";

export const metadata: Metadata = { title: "Página no encontrada · La Previa" };

/** Lo que se ve al abrir una dirección que no existe. */
export default function RutaNoEncontrada() {
  return (
    <PantallaDeAviso codigo="404" titulo="Esta cancha no existe" mensaje="La dirección que abriste no lleva a ninguna página.">
      <Link href="/" className={ACCION_PRINCIPAL_DEL_AVISO}>Volver al inicio</Link>
    </PantallaDeAviso>
  );
}
