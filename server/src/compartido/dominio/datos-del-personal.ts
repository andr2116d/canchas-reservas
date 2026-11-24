import type { RolUsuario } from './rol-usuario';

/** El personal completa o confirma sus datos en su primer ingreso; el jugador ya los dio al registrarse. */
export function debeCompletarDatos(
  rol: RolUsuario,
  datosConfirmadosEn: Date | null | undefined,
): boolean {
  return rol !== 'JUGADOR' && !datosConfirmadosEn;
}
