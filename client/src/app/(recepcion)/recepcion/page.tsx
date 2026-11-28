import type { Metadata } from "next";
import Link from "next/link";
import { PaginaDeLaAgenda } from "@/features/agenda/componentes/pagina-de-la-agenda";
import { RUTA_DEL_AVISO_DEL_PERSONAL } from "@/features/legal/ruta-del-aviso-del-personal";

export const metadata: Metadata = { title: "Agenda · La Previa" };

/** El inicio de recepción es la agenda del día, con el aviso de privacidad del personal al pie. */
export default function PaginaDeRecepcion() {
  return (
    <>
      <PaginaDeLaAgenda ruta="/recepcion" />
      <p className="text-sm text-grava">
        Cómo cuidamos tus datos:{" "}
        <Link href={RUTA_DEL_AVISO_DEL_PERSONAL} className="font-bold text-botella underline underline-offset-4">
          aviso de privacidad del personal
        </Link>
        .
      </p>
    </>
  );
}
