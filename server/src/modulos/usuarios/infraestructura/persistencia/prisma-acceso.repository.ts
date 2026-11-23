import { Inject, Injectable } from '@nestjs/common';
import {
  CIFRADOR,
  type Cifrador,
} from '../../../../compartido/aplicacion/cifrador.port';
import { PrismaService } from '../../../../compartido/infraestructura/prisma/prisma.service';
import type { Prisma } from '../../../../generated/prisma/client';
import type {
  AccesoRepository,
  CambioDeContrasena,
  CredencialesGuardadas,
  InicioAutenticado,
} from '../../dominio/acceso.repository';
import type { Correo } from '../../dominio/correo.value-object';
import { hashDeCorreo } from './usuario.mapper';

const CAMPOS_DE_ACCESO = {
  id: true,
  contrasenaHash: true,
  rol: true,
  estado: true,
  requiereCambiarContrasena: true,
  contrasenaTemporalVenceEn: true,
} as const satisfies Prisma.UsuarioSelect;

@Injectable()
export class PrismaAccesoRepository implements AccesoRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CIFRADOR) private readonly cifrador: Cifrador,
  ) {}

  async buscarPorCorreo(
    correo: Correo,
  ): Promise<CredencialesGuardadas | undefined> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correoHash: hashDeCorreo(correo, this.cifrador) },
      select: CAMPOS_DE_ACCESO,
    });
    return aCredenciales(usuario);
  }

  async buscarPorUsuario(
    usuarioId: number,
  ): Promise<CredencialesGuardadas | undefined> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: CAMPOS_DE_ACCESO,
    });
    return aCredenciales(usuario);
  }

  registrarInicio({ usuario, sesion }: InicioAutenticado): Promise<boolean> {
    return this.prisma.$transaction(async (base) => {
      if (!(await bloquearCuentaVigente(base, usuario))) return false;
      await base.sesion.create({
        data: { ...sesion, usuarioId: usuario.usuarioId },
      });
      await base.registroAcceso.create({
        data: {
          usuarioId: usuario.usuarioId,
          ocurridoEn: sesion.ultimaActividadEn,
        },
      });
      return true;
    });
  }

  cambiarContrasena({
    usuario,
    tokenHash,
    contrasenaHashNueva,
    sesion,
  }: CambioDeContrasena): Promise<boolean> {
    return this.prisma.$transaction(async (base) => {
      if (!(await bloquearCuentaVigente(base, usuario))) return false;
      const usuarioId = usuario.usuarioId;
      const { count } = await base.sesion.deleteMany({
        where: {
          usuarioId,
          tokenHash,
          expiraEn: { gt: sesion.ultimaActividadEn },
        },
      });
      if (!count) return false;
      await base.usuario.update({
        where: { id: usuarioId },
        data: {
          contrasenaHash: contrasenaHashNueva,
          requiereCambiarContrasena: false,
          contrasenaTemporalVenceEn: null,
        },
      });
      await base.sesion.deleteMany({ where: { usuarioId } });
      await base.sesion.create({ data: { ...sesion, usuarioId } });
      return true;
    });
  }
}

type FilaDeAcceso = Prisma.UsuarioGetPayload<{
  select: typeof CAMPOS_DE_ACCESO;
}>;

function aCredenciales(
  fila: FilaDeAcceso | null,
): CredencialesGuardadas | undefined {
  if (!fila) return undefined;
  const { id, contrasenaTemporalVenceEn, ...credenciales } = fila;
  return {
    usuarioId: id,
    ...credenciales,
    contrasenaTemporalVenceEn: contrasenaTemporalVenceEn ?? undefined,
  };
}

async function bloquearCuentaVigente(
  base: Prisma.TransactionClient,
  usuario: CredencialesGuardadas,
): Promise<boolean> {
  const filas = await base.$queryRaw<{ id: number }[]>`
    SELECT id FROM usuario
    WHERE id = ${usuario.usuarioId} AND estado = 'activo'
      AND rol::text = ${usuario.rol.toLowerCase()}
      AND contrasena_hash = ${usuario.contrasenaHash}
      AND requiere_cambiar_contrasena = ${usuario.requiereCambiarContrasena}
    FOR UPDATE`;
  return filas.length === 1;
}
