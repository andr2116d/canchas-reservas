import type { Metadata } from "next";
import { Suspense } from "react";
import { consultarElClub } from "@/compartido/club/servicios/club.servidor";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { DocumentoLegal } from "@/features/legal/componentes/documento-legal";
import { apartadosDeLasCancelaciones, VIGENCIA_DE_LAS_CANCELACIONES } from "@/features/legal/documentos/cancelaciones";

export const metadata: Metadata = { title: "Cancelaciones y devoluciones · La Previa" };

/** La política se arma con la regla y el adelanto que guardó administración. */
async function PoliticaDeCancelaciones() {
  const club = await consultarElClub();
  return <DocumentoLegal titulo="Cancelaciones y devoluciones" resumen="Cuánto se devuelve si cancelas, cómo y cuándo, con un ejemplo en soles." vigenteDesde={VIGENCIA_DE_LAS_CANCELACIONES} apartados={apartadosDeLasCancelaciones(club)} />;
}

export default function PaginaDeCancelaciones() {
  return (
    <Suspense fallback={<CargaDeContenido texto="Cargando la política…" />}>
      <PoliticaDeCancelaciones />
    </Suspense>
  );
}
