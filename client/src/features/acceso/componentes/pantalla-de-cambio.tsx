import { BarraDeSesion } from "@/compartido/sesion/barra-de-sesion";
import { exigirCambioDeContrasena } from "@/compartido/sesion/sesion.servidor";
import { FormularioDeCambio } from "./formulario-de-cambio";
import { TarjetaDeAcceso } from "./tarjeta-de-acceso";

/** Exige cambiar la contraseña temporal antes de acceder al panel. */
export async function PantallaDeCambio() {
  const sesion = await exigirCambioDeContrasena();

  return (
    <>
      <BarraDeSesion venceEn={sesion.venceEn} />
      <TarjetaDeAcceso titulo="Cambia tu contraseña">
        <p className="mb-4 text-grava">Para empezar, elige una contraseña nueva.</p>
        <FormularioDeCambio />
      </TarjetaDeAcceso>
    </>
  );
}
