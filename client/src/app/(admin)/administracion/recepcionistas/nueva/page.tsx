import type { Metadata } from "next";
import Link from "next/link";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { FormularioDeAlta } from "@/features/recepcionistas/componentes/formulario-de-alta";
import { BOTON_SECUNDARIO } from "@/features/recepcionistas/componentes/estilos";
import { dominioCorporativo } from "@/features/recepcionistas/servicios/dominio-corporativo";

export const metadata: Metadata = { title: "Nueva recepcionista · La Previa" };

export default function PaginaDeNuevaRecepcionista() {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Nueva recepcionista"
        descripcion="Sus datos personales, su correo institucional y una contraseña temporal para su primer acceso."
        accion={<Link href="/administracion/recepcionistas" className={BOTON_SECUNDARIO}>Volver al listado</Link>}
      />
      <FormularioDeAlta dominio={dominioCorporativo()} />
    </>
  );
}
