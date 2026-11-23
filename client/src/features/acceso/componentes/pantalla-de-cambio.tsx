import { BarraDeSesion } from "@/compartido/sesion/barra-de-sesion";
import { PANELES } from "@/compartido/sesion/destino-de-sesion";
import { exigirCambioDeContrasena } from "@/compartido/sesion/sesion.servidor";
import { FormularioDeCambio } from "./formulario-de-cambio";
import { TarjetaDeAcceso } from "./tarjeta-de-acceso";

/** Pide cambiar la contraseña temporal; se puede dejar para después. */
export async function PantallaDeCambio() {
  const sesion = await exigirCambioDeContrasena();

  return (
    <>
      <BarraDeSesion venceEn={sesion.venceEn} />
      <TarjetaDeAcceso titulo="Cambia tu contraseña temporal">
        <p className="mb-4 text-grava">Por seguridad, elige una contraseña que solo tú conozcas.</p>
        <FormularioDeCambio panel={PANELES[sesion.rol]} />
      </TarjetaDeAcceso>
    </>
  );
}
