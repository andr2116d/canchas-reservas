import type { ReactNode } from "react";
import type { Rol } from "../sesion/destino-de-sesion";
import { exigirPanel } from "../sesion/sesion.servidor";
import { describirTiempoRestante } from "../sesion/tiempo-restante";
import { AvisoDeContrasenaTemporal } from "./aviso-de-contrasena-temporal";
import { MarcoInterno } from "./marco-interno";

/**
 * Marco de los paneles: comprueba que la sesión sea del rol y recuerda cambiar
 * la contraseña si sigue temporal, con cuánto le queda.
 */
export async function MarcoDelPanel({ rol, children }: { rol: Rol; children: ReactNode }) {
  const { sesion } = await exigirPanel(rol);
  const venceLaTemporal = sesion.contrasenaTemporalVenceEn;
  const aviso = sesion.requiereCambiarContrasena && (
    <AvisoDeContrasenaTemporal
      tiempoRestante={venceLaTemporal && describirTiempoRestante(venceLaTemporal, new Date())}
    />
  );

  return (
    <MarcoInterno rol={rol} venceEn={sesion.venceEn} aviso={aviso}>
      {children}
    </MarcoInterno>
  );
}
