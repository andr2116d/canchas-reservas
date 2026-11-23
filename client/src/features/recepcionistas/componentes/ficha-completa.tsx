import Link from "next/link";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import type { DatosDeEdicion } from "../esquemas/recepcionista.schema";
import { dominioCorporativo } from "../servicios/dominio-corporativo";
import type { FichaDeRecepcionista } from "../servicios/ficha-de-recepcionista";
import { obtenerFicha } from "../servicios/recepcionistas.servidor";
import { AccionesDeCuenta } from "./acciones-de-cuenta";
import { BOTON_SECUNDARIO, TARJETA } from "./estilos";
import { FormularioDeEdicion } from "./formulario-de-edicion";
import { HistorialDeCuenta } from "./historial-de-cuenta";

/** Lo que el administrador puede editar, con el correo reducido a lo que va antes de la @. */
function datosEditables(ficha: FichaDeRecepcionista): DatosDeEdicion {
  const { nombres, apellidos, fechaNacimiento, tipoDocumento, numeroDocumento, celular, correo } = ficha;
  return { nombres, apellidos, fechaNacimiento, tipoDocumento, numeroDocumento, celular, usuarioDeCorreo: correo.split("@")[0] };
}

function SelloDeEstado({ activa }: { activa: boolean }) {
  return activa ? (
    <span className="inline-block rounded-full bg-capitan px-3 py-1 text-sm font-bold text-tinta">Activa</span>
  ) : (
    <span className="inline-block rounded-full bg-tiza/20 px-3 py-1 text-sm font-bold text-papel">Desactivada</span>
  );
}

/** Ficha de una recepcionista: sus datos editables, las acciones sobre su acceso y su historial. */
export async function FichaCompleta({ parametros }: { parametros: Promise<{ id: string }> }) {
  const { id } = await parametros;
  const { ficha, historial } = await obtenerFicha(id);
  const activa = ficha.estado === "ACTIVO";

  return (
    <>
      <EncabezadoDeSeccion
        titulo={`${ficha.nombres} ${ficha.apellidos}`}
        descripcion={ficha.correo}
        sello={<SelloDeEstado activa={activa} />}
        accion={<Link href="/administracion/recepcionistas" className={BOTON_SECUNDARIO}>Volver al listado</Link>}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="titulo-datos" className={`${TARJETA} flex flex-col gap-5`}>
          <h2 id="titulo-datos" className="font-titular text-2xl font-black text-tinta">Datos</h2>
          <FormularioDeEdicion
            id={ficha.id}
            dominio={dominioCorporativo()}
            datos={datosEditables(ficha)}
          />
        </section>
        <div className="flex flex-col gap-6">
          <div className={TARJETA}>
            <AccionesDeCuenta id={ficha.id} nombres={ficha.nombres} activa={activa} />
          </div>
          <section aria-labelledby="titulo-historial" className={`${TARJETA} flex flex-col gap-4`}>
            <h2 id="titulo-historial" className="font-titular text-2xl font-black text-tinta">Historial</h2>
            <HistorialDeCuenta historial={historial} />
          </section>
        </div>
      </div>
    </>
  );
}
