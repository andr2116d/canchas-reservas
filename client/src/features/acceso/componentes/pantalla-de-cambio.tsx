import { BarraDeNavegacion } from "@/compartido/marco/barra-de-navegacion";
import Link from "next/link";
import { PANELES } from "@/compartido/sesion/destino-de-sesion";
import { RUTA_DEL_AVISO_DEL_PERSONAL } from "@/features/legal/ruta-del-aviso-del-personal";
import { exigirCambioDeContrasena } from "@/compartido/sesion/sesion.servidor";
import { describirTiempoRestante } from "@/compartido/sesion/tiempo-restante";
import { FormularioDeCambio } from "./formulario-de-cambio";
import { TarjetaDeAcceso } from "./tarjeta-de-acceso";

/** Pide cambiar la contraseña temporal; se puede dejar para después. */
export async function PantallaDeCambio() {
  const sesion = await exigirCambioDeContrasena();

  return (
    <>
      <BarraDeNavegacion venceEn={sesion.venceEn} />
      <TarjetaDeAcceso titulo="Cambia tu contraseña temporal">
        <p className="mb-4 text-grava">
          Por seguridad, elige una contraseña que solo tú conozcas.
          {sesion.contrasenaTemporalVenceEn && (
            <> Tu contraseña temporal vence en {describirTiempoRestante(sesion.contrasenaTemporalVenceEn, new Date())}.</>
          )}
        </p>
        <FormularioDeCambio panel={PANELES[sesion.rol]} />
        {sesion.rol !== "JUGADOR" && (
          <p className="mt-5 text-center text-sm">
            <Link href={RUTA_DEL_AVISO_DEL_PERSONAL} className="font-bold text-botella underline underline-offset-4">
              Aviso de privacidad del personal
            </Link>
          </p>
        )}
      </TarjetaDeAcceso>
    </>
  );
}
