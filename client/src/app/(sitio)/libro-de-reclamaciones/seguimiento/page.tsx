import type { Metadata } from "next";
import Link from "next/link";
import { TARJETA } from "@/compartido/ui/estilos";
import { CabeceraDelLibro } from "@/features/libro-de-reclamaciones/componentes/cabecera-del-libro";
import { SeguimientoDeLaHoja } from "@/features/libro-de-reclamaciones/componentes/seguimiento-de-la-hoja";

export const metadata: Metadata = { title: "Sigue tu hoja · Libro de Reclamaciones · La Previa" };

export default function PaginaDelSeguimiento() {
  return (
    <>
      <CabeceraDelLibro titulo="Sigue tu hoja" resumen="Con el número y el código de tu constancia, sin iniciar sesión.">
        <p className="text-sm text-tiza/80">
          ¿Aún no la registras? <Link href="/libro-de-reclamaciones" className="font-bold text-capitan underline underline-offset-2">Registra tu reclamo o queja</Link>.
        </p>
      </CabeceraDelLibro>
      <div className="envoltura-del-sitio py-10">
        <section className={TARJETA}>
          <SeguimientoDeLaHoja />
        </section>
      </div>
    </>
  );
}
