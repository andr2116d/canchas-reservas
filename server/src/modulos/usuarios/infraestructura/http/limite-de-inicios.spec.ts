import { randomBytes } from 'node:crypto';
import { RelojDePrueba } from '../../../../../test/compartido/dobles/reloj-de-prueba';
import { AesGcmCifradorAdapter } from '../../../../compartido/infraestructura/cifrado/aes-gcm-cifrador.adapter';
import { LimiteDeInicios } from './limite-de-inicios';

const CORREO = 'jugador@externo.test';

function prepararLimite() {
  const reloj = new RelojDePrueba();
  const cifrador = new AesGcmCifradorAdapter(randomBytes(32), randomBytes(32));
  return { reloj, limite: new LimiteDeInicios(cifrador, reloj) };
}

function fallar(limite: LimiteDeInicios, veces: number, correo = CORREO) {
  for (let intento = 0; intento < veces; intento++)
    limite.registrarFallo(correo);
}

describe('LimiteDeInicios', () => {
  it('deja intentar mientras haya menos de 8 fallos', () => {
    const { limite } = prepararLimite();

    fallar(limite, 7);

    expect(limite.segundosDeEspera(CORREO)).toBe(0);
  });

  it('bloquea el correo 15 minutos al llegar a 8 fallos', () => {
    const { limite } = prepararLimite();

    fallar(limite, 8);

    expect(limite.segundosDeEspera(CORREO)).toBe(15 * 60);
  });

  it('reconoce el mismo correo aunque cambien mayúsculas o espacios', () => {
    const { limite } = prepararLimite();

    fallar(limite, 8, ' JUGADOR@Externo.test ');

    expect(limite.segundosDeEspera(CORREO)).toBeGreaterThan(0);
  });

  it('un ingreso correcto reinicia el contador', () => {
    const { limite } = prepararLimite();
    fallar(limite, 7);

    limite.reiniciar(CORREO);
    fallar(limite, 7);

    expect(limite.segundosDeEspera(CORREO)).toBe(0);
  });

  it('el bloqueo vence a los 15 minutos', () => {
    const { limite, reloj } = prepararLimite();
    fallar(limite, 8);

    reloj.avanzarMinutos(15);

    expect(limite.segundosDeEspera(CORREO)).toBe(0);
  });

  it('los fallos viejos se olvidan pasada la ventana de 15 minutos', () => {
    const { limite, reloj } = prepararLimite();
    fallar(limite, 7);

    reloj.avanzarMinutos(15);
    fallar(limite, 1);

    expect(limite.segundosDeEspera(CORREO)).toBe(0);
  });

  it('cuenta cada correo por separado', () => {
    const { limite } = prepararLimite();

    fallar(limite, 8);

    expect(limite.segundosDeEspera('otra@externo.test')).toBe(0);
  });
});
