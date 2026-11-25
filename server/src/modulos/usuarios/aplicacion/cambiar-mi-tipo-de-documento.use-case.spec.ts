import { EnMemoriaUsuarioRepository } from '../../../../test/usuarios/dobles/en-memoria-usuario.repository';
import { RelojDePrueba } from '../../../../test/compartido/dobles/reloj-de-prueba';
import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { Celular } from '../dominio/celular.value-object';
import { Correo } from '../../../compartido/dominio/correo.value-object';
import { CuentaYaExisteError } from '../dominio/cuenta-ya-existe.error';
import { DocumentoIdentidad } from '../../../compartido/dominio/documento-identidad.value-object';
import { FechaNacimiento } from '../dominio/fecha-nacimiento.value-object';
import { NombrePersona } from '../../../compartido/dominio/nombre-persona.value-object';
import { Usuario } from '../dominio/usuario.entity';
import { CambiarMiTipoDeDocumentoUseCase } from './cambiar-mi-tipo-de-documento.use-case';

const CARNE = {
  tipoDocumento: 'CARNE_EXTRANJERIA',
  numeroDocumento: '001234567',
  aceptaAviso: true,
};

async function preparar() {
  const usuarios = new EnMemoriaUsuarioRepository();
  const reloj = new RelojDePrueba(new Date('2026-11-24T15:00:00.000Z'));
  const persona = (correo: string, numero: string) => ({
    nombres: NombrePersona.crear('Rosa', 'nombres'),
    apellidos: NombrePersona.crear('Quispe', 'apellidos'),
    fechaNacimiento: FechaNacimiento.restaurar('1995-02-01'),
    documento: DocumentoIdentidad.crear('DNI', numero),
    correo: Correo.crear(correo),
    celular: Celular.crear('912345678'),
    contrasenaHash: 'hash',
  });
  const vence = new Date('2026-11-29T00:00:00.000Z');
  await usuarios.crearPersonal(
    Usuario.registrarRecepcionista(
      persona('rosa@laprevia.pe', '41234567'),
      vence,
    ),
  );
  await usuarios.crear(
    Usuario.registrarJugador(persona('rosa@gmail.com', '41234567')),
  );
  return {
    usuarios,
    reloj,
    cambiar: new CambiarMiTipoDeDocumentoUseCase(usuarios, reloj),
  };
}

const errorDe = (promesa: Promise<unknown>) =>
  promesa.then(
    () => undefined,
    (e: unknown) => e,
  );

describe('CambiarMiTipoDeDocumentoUseCase', () => {
  it('pasa de DNI a carné de extranjería una vez y lo deja en la auditoría', async () => {
    const { cambiar, usuarios, reloj } = await preparar();

    await cambiar.ejecutar(1, CARNE);

    const recepcionista = await usuarios.buscarPorId(1);
    expect(recepcionista?.documento?.tipo).toBe('CARNE_EXTRANJERIA');
    expect(recepcionista?.documento?.numero).toBe('001234567');
    expect(recepcionista?.documentoCambiadoEn).toEqual(reloj.ahora());
    expect(usuarios.auditoria.map((a) => a.accion)).toEqual([
      'CAMBIO_DE_DOCUMENTO',
    ]);
  });

  it('no se puede hacer una segunda vez', async () => {
    const { cambiar } = await preparar();
    await cambiar.ejecutar(1, CARNE);

    const error = await errorDe(
      cambiar.ejecutar(1, {
        ...CARNE,
        tipoDocumento: 'DNI',
        numeroDocumento: '45678912',
      }),
    );

    expect(error).toBeInstanceOf(ConflictoError);
    expect((error as ConflictoError).message).toBe(
      'El tipo de documento ya se cambió una vez. Para otro cambio, habla con administración.',
    );
  });

  it('exige aceptar el aviso legal y un tipo distinto del actual', async () => {
    const { cambiar } = await preparar();

    const sinAviso = await errorDe(
      cambiar.ejecutar(1, { ...CARNE, aceptaAviso: false }),
    );
    const mismoTipo = await errorDe(
      cambiar.ejecutar(1, {
        tipoDocumento: 'DNI',
        numeroDocumento: '45678912',
        aceptaAviso: true,
      }),
    );

    expect((sinAviso as ReglaInvalidaError).errores).toEqual({
      aceptaAviso:
        'Confirma que leíste el aviso antes de cambiar el tipo de documento.',
    });
    expect((mismoTipo as ReglaInvalidaError).errores).toEqual({
      tipoDocumento: 'Elige un tipo de documento distinto al actual.',
    });
  });

  it('valida el número nuevo y que no lo use otra cuenta del mismo rol', async () => {
    const { cambiar, usuarios } = await preparar();
    await usuarios.crearPersonal(
      Usuario.restaurar({
        ...(await usuarios.buscarPorId(1))!.estadoGuardado,
        id: 9,
        correo: Correo.crear('otra@laprevia.pe'),
        documento: DocumentoIdentidad.crear('CARNE_EXTRANJERIA', '001234567'),
      }),
    );

    const invalido = await errorDe(
      cambiar.ejecutar(1, { ...CARNE, numeroDocumento: '1' }),
    );
    const ocupado = await errorDe(cambiar.ejecutar(1, CARNE));

    expect(Object.keys((invalido as ReglaInvalidaError).errores)).toEqual([
      'numeroDocumento',
    ]);
    expect(ocupado).toBeInstanceOf(CuentaYaExisteError);
  });

  it('el jugador no cambia su documento desde la cuenta', async () => {
    const { cambiar } = await preparar();

    await expect(cambiar.ejecutar(2, CARNE)).rejects.toThrow(
      ReglaInvalidaError,
    );
  });
});
