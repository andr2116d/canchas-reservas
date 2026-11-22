import { redirect } from "next/navigation";
import { BarraDeSesion } from "@/compartido/sesion/barra-de-sesion";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { consultarApiPrivada, exigirPanel } from "@/compartido/sesion/sesion.servidor";

const PANELES_DEL_PERSONAL = {
  ADMINISTRADOR: { recurso: "paneles/administracion", titulo: "Administración" },
  RECEPCIONISTA: { recurso: "paneles/recepcion", titulo: "Recepción" },
} as const;

/** Muestra el panel solo cuando la API confirma el permiso del personal. */
export async function PanelDelPersonal({ rol }: { rol: keyof typeof PANELES_DEL_PERSONAL }) {
  const { recurso, titulo } = PANELES_DEL_PERSONAL[rol];
  const { cookie } = await exigirPanel(rol);
  const respuesta = await consultarApiPrivada(recurso, cookie);
  if (respuesta.status === 401) redirect(RUTA_DE_ACCESO);
  if (respuesta.status === 403) redirect("/acceso-no-autorizado");
  if (!respuesta.ok) throw new Error("No pudimos cargar el panel.");
  const { venceEn } = await respuesta.json() as { venceEn: string };

  return (
    <>
      <BarraDeSesion venceEn={venceEn} />
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <h1 className="font-titular text-5xl leading-tight font-black text-tinta">{titulo}</h1>
      </main>
    </>
  );
}
