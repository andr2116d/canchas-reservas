import { redirect } from "next/navigation";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { exigirPanel } from "@/compartido/sesion/sesion.servidor";
import { obtenerCuenta } from "@/compartido/cuenta/cuenta.servidor";

/** Saludo al jugador que tiene una sesión válida. */
export async function Bienvenida() {
  const { cookie } = await exigirPanel("JUGADOR");
  const cuenta = await obtenerCuenta(cookie);
  if (!cuenta) redirect(RUTA_DE_ACCESO);

  return <EncabezadoDeSeccion titulo={`Hola, ${cuenta.nombres}.`} descripcion="Tu cuenta en La Previa está lista." />;
}
