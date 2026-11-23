import type { ReactNode } from "react";
import type { Rol } from "../sesion/destino-de-sesion";
import { exigirPanel } from "../sesion/sesion.servidor";
import { AvisoDeContrasenaTemporal } from "./aviso-de-contrasena-temporal";
import { BarraDeNavegacion } from "./barra-de-navegacion";

/**
 * Marco común de las pantallas internas: comprueba que la sesión sea del rol,
 * pone la barra de vidrio y recuerda cambiar la contraseña si sigue temporal.
 */
export async function MarcoDelPanel({ rol, children }: { rol: Rol; children: ReactNode }) {
  const { sesion } = await exigirPanel(rol);

  return (
    <div className="marco-interno" data-rol={rol}>
      <BarraDeNavegacion rol={rol} venceEn={sesion.venceEn} />
      <main className="mx-auto flex w-[min(72rem,calc(100%-1.5rem))] flex-col gap-8 px-1 pt-8 pb-16 sm:pt-12">
        {sesion.requiereCambiarContrasena && <AvisoDeContrasenaTemporal />}
        {children}
      </main>
    </div>
  );
}
