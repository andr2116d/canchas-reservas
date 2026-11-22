import type { RolUsuario } from '../../../compartido/dominio/rol-usuario';
import type { Correo } from './correo.value-object';

export function admiteDominio(
  rol: RolUsuario,
  correo: Correo,
  dominioCorporativo?: string,
): boolean {
  return (
    rol !== 'ADMINISTRADOR' ||
    correo.direccion.split('@')[1] === dominioCorporativo
  );
}
