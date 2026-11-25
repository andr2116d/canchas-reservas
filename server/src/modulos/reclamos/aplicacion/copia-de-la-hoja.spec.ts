import { unaHojaValida } from '../../../../test/reclamos/fabricas/datos-de-hoja';
import { HojaDeReclamacion } from '../dominio/hoja-de-reclamacion.entity';
import { redactarCopiaDeLaHoja } from './copia-de-la-hoja';
import type { Constancia } from './registrar-hoja.use-case';
import { verHoja } from './vista-de-la-hoja';

function unaConstancia(
  cambios: Parameters<typeof unaHojaValida>[0] = {},
): Constancia {
  const hoja = HojaDeReclamacion.registrar(
    unaHojaValida(cambios),
    new Date('2026-11-25T15:00:00.000Z'),
  );
  return {
    numero: '000014-2026',
    codigo: 'K7QP-4ZMD',
    registradaEn: hoja.registradaEn,
    fechaLimite: hoja.fechaLimite,
    proveedor: { razonSocial: null, ruc: null, direccion: null },
    hoja: verHoja(hoja),
  };
}

describe('redactarCopiaDeLaHoja', () => {
  it('lleva el número en el asunto, sin datos personales', () => {
    expect(redactarCopiaDeLaHoja(unaConstancia()).asunto).toBe(
      'Hoja de reclamación N.º 000014-2026',
    );
  });

  it('el texto trae el número, el código, la fecha y hora de Lima y el plazo', () => {
    const { texto } = redactarCopiaDeLaHoja(unaConstancia());

    expect(texto).toContain('Hoja N.º 000014-2026');
    expect(texto).toContain('Código de seguimiento: K7QP-4ZMD');
    expect(texto).toContain('Registrada el 25/11/2026 a las 10:00');
    expect(texto).toContain(
      'Te responderemos a más tardar el 16/12/2026, por correo.',
    );
  });

  it('copia lo que escribió la persona y los datos pendientes del proveedor', () => {
    const { texto } = redactarCopiaDeLaHoja(unaConstancia());

    expect(texto).toContain('Reclamo');
    expect(texto).toContain(
      'La cancha estaba ocupada al llegar y no pudimos jugar.',
    );
    expect(texto).toContain('Que devuelvan el adelanto completo.');
    expect(texto).toContain('Monto reclamado: S/ 40.00');
    expect(texto).toContain('Razón social: por publicar');
  });

  it('dice que reclamar no impide acudir a Indecopi', () => {
    expect(redactarCopiaDeLaHoja(unaConstancia()).texto).toContain(
      'ni es requisito previo para interponer una denuncia ante el Indecopi',
    );
  });

  it('el HTML no deja pasar etiquetas escritas por la persona', () => {
    const { html } = redactarCopiaDeLaHoja(
      unaConstancia({ detalle: '<script>alert(1)</script> & "otro"' }),
    );

    expect(html).not.toContain('<script>');
    expect(html).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;otro&quot;',
    );
  });
});
