import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { obtenerCuenta } from "@/compartido/cuenta/cuenta.servidor";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { TARJETA } from "@/compartido/ui/estilos";
import { CabeceraDelLibro } from "@/features/libro-de-reclamaciones/componentes/cabecera-del-libro";
import { FormularioDelLibro } from "@/features/libro-de-reclamaciones/componentes/formulario-del-libro";
import { LateralDelLibro } from "@/features/libro-de-reclamaciones/componentes/lateral-del-libro";

export const metadata: Metadata = { title: "Libro de Reclamaciones · La Previa" };

/** Con sesión de jugador, la hoja empieza con los datos de su cuenta (menos el domicilio). */
async function FormularioConLaCuenta() {
  const cuenta = await obtenerCuenta((await cookies()).toString()).catch(() => undefined);
  const delJugador = cuenta?.rol === "JUGADOR" ? cuenta : undefined;
  return (
    <FormularioDelLibro
      cuenta={
        delJugador && {
          tipoDocumento: delJugador.tipoDocumento ?? "DNI",
          numeroDocumento: delJugador.numeroDocumento ?? "",
          nombres: delJugador.nombres,
          apellidos: delJugador.apellidos,
          telefono: delJugador.celular ?? "",
          correo: delJugador.correo,
        }
      }
    />
  );
}

export default function PaginaDelLibro() {
  return (
    <>
      <CabeceraDelLibro titulo="Registra tu reclamo o queja" resumen="Te respondemos por escrito en un plazo máximo de 15 días hábiles." />
      <div className="envoltura-del-sitio grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <section aria-label="Hoja de reclamación" className={`${TARJETA} print:border-0 print:p-0 print:shadow-none`}>
          <Suspense fallback={<CargaDeContenido texto="Preparando la hoja…" />}>
            <FormularioConLaCuenta />
          </Suspense>
        </section>
        <LateralDelLibro />
      </div>
    </>
  );
}
