import Link from "next/link";
import { destinoDeSesion, RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { sesionDeLaVisita } from "@/compartido/sesion/sesion.servidor";
import { MenuDelSitio } from "./menu-del-sitio";

/** El menú de secciones, que en el celular ofrece ingresar solo a quien no tiene sesión. */
export async function MenuSegunLaSesion() {
  return <MenuDelSitio mostrarIngreso={!(await sesionDeLaVisita())} />;
}

/** Con sesión, lleva al panel de quien entra; sin sesión, a ingresar o crear la cuenta. */
export async function AccesoDelSitio() {
  const sesion = await sesionDeLaVisita();
  if (sesion) return <Link href={destinoDeSesion(sesion)} className="boton-del-sitio boton-del-sitio--capitan">Ir a mi panel</Link>;
  return (
    <>
      <Link href={RUTA_DE_ACCESO} className="boton-del-sitio boton-del-sitio--vidrio max-lg:hidden">Ingresar</Link>
      <Link href="/registro" className="boton-del-sitio boton-del-sitio--capitan">Crear cuenta</Link>
    </>
  );
}
