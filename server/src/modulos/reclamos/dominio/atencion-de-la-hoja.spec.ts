import {
  ConflictoError,
  ReglaInvalidaError,
} from '../../../compartido/dominio/dominio.error';
import { unaHojaValida } from '../../../../test/reclamos/fabricas/datos-de-hoja';
import { HojaDeReclamacion } from './hoja-de-reclamacion.entity';

const REGISTRADA_EN = new Date('2026-11-25T15:00:00.000Z');
const DIAS = (n: number) => new Date(REGISTRADA_EN.getTime() + n * 86_400_000);

const unaHoja = (cambios: Parameters<typeof unaHojaValida>[0] = {}) =>
  HojaDeReclamacion.registrar(unaHojaValida(cambios), REGISTRADA_EN);

function errores(accion: () => void) {
  try {
    accion();
  } catch (error) {
    if (error instanceof ReglaInvalidaError) return error.errores;
    throw error;
  }
  throw new Error('Se esperaba un error de validación.');
}

describe('atención de una hoja', () => {
  describe('abrir', () => {
    it('la primera vez pasa de nueva a en atención y recuerda cuándo', () => {
      const hoja = unaHoja();

      expect(hoja.abrir(DIAS(1))).toBe(true);
      expect(hoja.estado).toBe('EN_ATENCION');
      expect(hoja.abiertaEn).toEqual(DIAS(1));
    });

    it('abrirla otra vez no cambia nada', () => {
      const hoja = unaHoja();
      hoja.abrir(DIAS(1));

      expect(hoja.abrir(DIAS(2))).toBe(false);
      expect(hoja.abiertaEn).toEqual(DIAS(1));
    });
  });

  describe('clasificar', () => {
    it('pone el motivo y devuelve el anterior y el nuevo', () => {
      const hoja = unaHoja();

      expect(hoja.clasificar('ESTADO_DE_LA_CANCHA')).toEqual({
        antes: null,
        despues: 'ESTADO_DE_LA_CANCHA',
      });
      expect(hoja.motivo).toBe('ESTADO_DE_LA_CANCHA');
    });

    it('el mismo motivo no es un cambio', () => {
      const hoja = unaHoja();
      hoja.clasificar('OTRO');

      expect(hoja.clasificar('OTRO')).toBeNull();
    });

    it('rechaza un motivo que no está en la lista', () => {
      expect(errores(() => unaHoja().clasificar('PRECIOS'))).toEqual({
        motivo: 'Elige un motivo de la lista.',
      });
    });
  });

  describe('tramitar como reclamo', () => {
    it('una queja pasa a tramitarse como reclamo y conserva lo que marcó la persona', () => {
      const hoja = unaHoja({ tipo: 'QUEJA' });

      hoja.tramitarComoReclamo();

      expect(hoja.tipo).toBe('RECLAMO');
      expect(hoja.tipoMarcado).toBe('QUEJA');
    });

    it('no aplica a lo que ya es reclamo ni a una hoja respondida', () => {
      const respondida = unaHoja({ tipo: 'QUEJA' });
      respondida.responder(
        { texto: 'Revisamos el caso con el personal.' },
        DIAS(1),
      );

      expect(() => unaHoja().tramitarComoReclamo()).toThrow(
        new ConflictoError('Esta hoja ya se tramita como reclamo.', {}),
      );
      expect(() => respondida.tramitarComoReclamo()).toThrow(
        new ConflictoError(
          'La hoja ya fue respondida: su tipo ya no cambia.',
          {},
        ),
      );
    });
  });

  describe('responder', () => {
    it('por correo queda respondida con la fecha y hora de la respuesta', () => {
      const hoja = unaHoja();

      hoja.responder({ texto: '  Devolvimos el adelanto el 1/12.  ' }, DIAS(6));

      expect(hoja.estado).toBe('RESPONDIDA');
      expect(hoja.respuesta).toEqual({
        texto: 'Devolvimos el adelanto el 1/12.',
        respondidaEn: DIAS(6),
        cartaEnviadaEl: null,
      });
      expect(hoja.abiertaEn).toEqual(DIAS(6));
      expect(hoja.fueraDePlazo).toBe(false);
    });

    it('por carta exige la fecha de envío, que no puede ser futura ni anterior al registro', () => {
      const hoja = unaHoja({ medioDeRespuesta: 'CARTA' });

      expect(
        errores(() => hoja.responder({ texto: 'Respuesta.' }, DIAS(3))),
      ).toEqual({
        cartaEnviadaEl: 'Ingresa la fecha en que se envió la carta.',
      });
      expect(
        errores(() =>
          hoja.responder(
            { texto: 'Respuesta.', cartaEnviadaEl: '2026-11-24' },
            DIAS(3),
          ),
        ),
      ).toEqual({
        cartaEnviadaEl:
          'La carta no puede haberse enviado antes de registrar la hoja (25/11/2026).',
      });
      expect(
        errores(() =>
          hoja.responder(
            { texto: 'Respuesta.', cartaEnviadaEl: '2026-12-30' },
            DIAS(3),
          ),
        ),
      ).toEqual({ cartaEnviadaEl: 'La fecha de envío no puede ser futura.' });
    });

    it('por carta, el plazo se cumple con la fecha de envío de la carta', () => {
      const hoja = unaHoja({ medioDeRespuesta: 'CARTA' });

      hoja.responder(
        { texto: 'Respuesta.', cartaEnviadaEl: '2026-12-17' },
        DIAS(23),
      );

      expect(hoja.respuesta?.cartaEnviadaEl).toBe('2026-12-17');
      expect(hoja.fueraDePlazo).toBe(true);
    });

    it('una respuesta vacía o muy larga no se guarda', () => {
      expect(
        errores(() => unaHoja().responder({ texto: ' ' }, DIAS(1))),
      ).toEqual({
        respuesta: 'Ingresa la respuesta.',
      });
      expect(
        errores(() =>
          unaHoja().responder({ texto: 'a'.repeat(4001) }, DIAS(1)),
        ),
      ).toEqual({
        respuesta: 'La respuesta no puede tener más de 4000 caracteres.',
      });
    });

    it('una hoja respondida no se vuelve a responder: la respuesta no se cambia', () => {
      const hoja = unaHoja();
      hoja.responder({ texto: 'Primera.' }, DIAS(1));

      expect(() => hoja.responder({ texto: 'Otra.' }, DIAS(2))).toThrow(
        new ConflictoError(
          'La hoja ya fue respondida. La respuesta no se cambia.',
          {},
        ),
      );
    });

    it('responder después de la fecha límite queda fuera de plazo', () => {
      const hoja = unaHoja();

      hoja.responder({ texto: 'Tarde.' }, new Date('2026-12-17T15:00:00.000Z'));

      expect(hoja.fueraDePlazo).toBe(true);
    });
  });
});
