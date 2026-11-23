"use client";

import Link from "next/link";
import {
  ACCION_PRINCIPAL_DEL_AVISO,
  ACCION_SECUNDARIA_DEL_AVISO,
  PantallaDeAviso,
} from "@/compartido/ui/pantalla-de-aviso";

interface ErrorDelSitioProps {
  error: Error & { digest?: string };
  retry: () => void;
  reset: () => void;
}

/** Lo que se ve si una página falla al cargar. No muestra el detalle técnico del error. */
export default function ErrorDelSitio({ retry }: ErrorDelSitioProps) {
  return (
    <PantallaDeAviso titulo="Se cortó la jugada" mensaje="No pudimos cargar esta página. Intenta de nuevo en unos segundos.">
      <button type="button" onClick={() => retry()} className={ACCION_PRINCIPAL_DEL_AVISO}>Intentar de nuevo</button>
      <Link href="/" className={ACCION_SECUNDARIA_DEL_AVISO}>Volver al inicio</Link>
    </PantallaDeAviso>
  );
}
