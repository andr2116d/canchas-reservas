import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, type Reloj } from '../../../compartido/aplicacion/reloj.port';
import { Correo } from '../../../compartido/dominio/correo.value-object';
import { DocumentoIdentidad } from '../../../compartido/dominio/documento-identidad.value-object';
import { validarCampos } from '../../../compartido/dominio/validar-campos';
import { ValorInvalidoError } from '../../../compartido/dominio/valor-invalido.error';
import { validarVersionLegal } from '../dominio/aceptacion-legal-registro';
import { Celular } from '../dominio/celular.value-object';
import { ReglasDeCorreo } from '../dominio/reglas-de-correo';
import {
  construirDatosPersonales,
  type DatosPersonalesEscritos,
} from './datos-personales';

export const CLIENTES_DE_RECEPCION = Symbol('CLIENTES_DE_RECEPCION');

export interface ClienteDeRecepcion {
  id: number;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
}

type DatosPersonalesValidados = ReturnType<typeof construirDatosPersonales>;

export type AltaDeCliente = {
  [Campo in keyof DatosPersonalesValidados]: ReturnType<
    DatosPersonalesValidados[Campo]
  >;
} & {
  correo?: Correo;
  versionDelAviso: string;
  informadoPorId: number;
  informadoEn: Date;
};

export interface ClientesDeRecepcion {
  buscarPorDocumento(
    documento: DocumentoIdentidad,
  ): Promise<ClienteDeRecepcion | undefined>;
  buscarPorCelular(celular: Celular): Promise<ClienteDeRecepcion[]>;
  guardar(
    alta: AltaDeCliente,
  ): Promise<{ cliente: ClienteDeRecepcion; existente: boolean }>;
}

export interface AltaDeClienteSolicitada extends DatosPersonalesEscritos {
  correo?: string;
  versionDelAviso: string;
}

@Injectable()
export class ClientesDeRecepcionUseCase {
  constructor(
    @Inject(CLIENTES_DE_RECEPCION)
    private readonly clientes: ClientesDeRecepcion,
    @Inject(RELOJ) private readonly reloj: Reloj,
    private readonly correos: ReglasDeCorreo,
  ) {}

  async buscar({
    tipoDocumento,
    numeroDocumento,
    celular,
  }: {
    tipoDocumento?: string;
    numeroDocumento?: string;
    celular?: string;
  }): Promise<ClienteDeRecepcion[]> {
    if (celular != null && tipoDocumento == null && numeroDocumento == null) {
      const datos = validarCampos({ celular: () => Celular.crear(celular) });
      return this.clientes.buscarPorCelular(datos.celular);
    }
    const datos = validarCampos({
      numeroDocumento: () => {
        if (celular != null)
          throw new ValorInvalidoError('Busca por documento o por celular.');
        return DocumentoIdentidad.crear(
          tipoDocumento ?? '',
          numeroDocumento ?? '',
        );
      },
    });
    const cliente = await this.clientes.buscarPorDocumento(
      datos.numeroDocumento,
    );
    return cliente ? [cliente] : [];
  }

  async registrar(datos: AltaDeClienteSolicitada, informadoPorId: number) {
    const informadoEn = this.reloj.ahora();
    const campos = validarCampos({
      ...construirDatosPersonales(datos, informadoEn),
      correo: () =>
        datos.correo?.trim()
          ? this.correos.exigirParaRol('JUGADOR', Correo.crear(datos.correo))
          : undefined,
      versionDelAviso: () => {
        if (!datos.versionDelAviso)
          throw new ValorInvalidoError(
            'Confirma que informaste el aviso de privacidad.',
          );
        return validarVersionLegal(datos.versionDelAviso);
      },
    });
    return this.clientes.guardar({ ...campos, informadoEn, informadoPorId });
  }
}
