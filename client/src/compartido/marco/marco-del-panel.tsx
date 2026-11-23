import type { ReactNode } from "react";
import type { Rol } from "../sesion/destino-de-sesion";
import { exigirPanel } from "../sesion/sesion.servidor";
import { describirTiempoRestante } from "../sesion/tiempo-restante";
import { AvisoDeContrasenaTemporal } from "./aviso-de-contrasena-temporal";
import { BarraDeNavegacion } from "./barra-de-navegacion";

function tiempoRestante(venceEn: string | undefined): string | undefined {
  return venceEn && describirTiempoRestante(venceEn, new Date());
}

/**
 * Marco común de las pantallas internas: comprueba que la sesión sea del rol,
 * pone la barra de vidrio y recuerda cambiar la contraseña si sigue temporal.
 */
export async function MarcoDelPanel({ rol, children }: { rol: Rol; children: ReactNode }) {
  const { sesion } = await exigirPanel(rol);

  return (
    <div className="marco-interno" data-rol={rol}>
      <a href="#contenido" className="saltar-al-contenido">Saltar al contenido</a>
      <BarraDeNavegacion rol={rol} venceEn={sesion.venceEn} />
      <main id="contenido" tabIndex={-1} className="contenido-interno">
        {sesion.requiereCambiarContrasena && (
          <AvisoDeContrasenaTemporal tiempoRestante={tiempoRestante(sesion.contrasenaTemporalVenceEn)} />
        )}
        {children}
      </main>
    </div>
  );
}
