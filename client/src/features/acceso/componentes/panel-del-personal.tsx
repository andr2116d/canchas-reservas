import Link from "next/link";
import { redirect } from "next/navigation";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { RUTA_DEL_AVISO_DEL_PERSONAL } from "@/features/legal/ruta-del-aviso-del-personal";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { consultarApiPrivada, exigirPanel } from "@/compartido/sesion/sesion.servidor";

const PANELES_DEL_PERSONAL = {
  ADMINISTRADOR: {
    recurso: "paneles/administracion",
    titulo: "Administración",
    descripcion: "El personal y la operación de La Previa, en un solo lugar.",
  },
} as const;

/** Acceso directo del resumen de administración a la gestión de recepcionistas. */
function AccesoARecepcionistas() {
  return (
    <Link
      href="/administracion/recepcionistas"
      className="group flex flex-col gap-2 rounded-2xl border border-white/80 bg-papel p-6 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-botella md:max-w-md"
    >
      <span className="font-titular text-3xl leading-none font-black text-tinta">Recepcionistas</span>
      <span className="text-grava">Crea, edita y desactiva las cuentas de recepción.</span>
      <span className="font-bold text-botella group-hover:underline">Gestionar recepcionistas</span>
    </Link>
  );
}

/** Muestra el panel solo cuando la API confirma el permiso del personal. */
export async function PanelDelPersonal({ rol }: { rol: keyof typeof PANELES_DEL_PERSONAL }) {
  const { recurso, titulo, descripcion } = PANELES_DEL_PERSONAL[rol];
  const { cookie } = await exigirPanel(rol);
  const respuesta = await consultarApiPrivada(recurso, cookie);
  if (respuesta.status === 401) redirect(RUTA_DE_ACCESO);
  if (respuesta.status === 403) redirect("/acceso-no-autorizado");
  if (!respuesta.ok) throw new Error("No pudimos cargar el panel.");

  return (
    <>
      <EncabezadoDeSeccion titulo={titulo} descripcion={descripcion} />
      <AccesoARecepcionistas />
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
