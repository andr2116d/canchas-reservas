import { instanteEnLima, sumarDias } from '../../common/fechas-lima';
import type { Rol } from '../../generated/prisma/enums';
import type { ConsultaPaginadaDto } from './dto/consulta-paginada.dto';

export const CAMPOS_USUARIO = {
  id: true,
  nombres: true,
  apellidos: true,
  rol: true,
} as const;

type UsuarioLeido = {
  id: number;
  nombres: string;
  apellidos: string | null;
  rol: Rol;
};

export function rangoDeFechas({ desde, hasta }: ConsultaPaginadaDto) {
  if (!desde && !hasta) return undefined;
  return {
    ...(desde ? { gte: instanteEnLima(desde, '00:00') } : {}),
    ...(hasta ? { lt: instanteEnLima(sumarDias(hasta, 1), '00:00') } : {}),
  };
}

export function pagina({ pagina, tamano }: ConsultaPaginadaDto) {
  return { skip: (pagina - 1) * tamano, take: tamano };
}

export function aUsuario(usuario: UsuarioLeido | null) {
  if (!usuario) return null;
  return {
    id: usuario.id,
    nombre: [usuario.nombres, usuario.apellidos]
      .map((parte) => parte?.trim())
      .filter(Boolean)
      .join(' '),
    rol: usuario.rol,
  };
}
