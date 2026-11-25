import { leerConfiguracionDeCorreo } from './configuracion-de-correo';

const PRODUCCION = {
  NODE_ENV: 'production',
  SMTP_SERVIDOR: 'email-smtp.us-east-1.amazonaws.com',
  SMTP_PUERTO: '587',
  SMTP_USUARIO: 'usuario-smtp',
  SMTP_CONTRASENA: 'clave-smtp',
  CORREO_REMITENTE: 'La Previa <avisos@dominio-del-local.pe>',
};

describe('leerConfiguracionDeCorreo', () => {
  it('en desarrollo usa el servidor de prueba local sin credenciales ni TLS', () => {
    expect(leerConfiguracionDeCorreo({ NODE_ENV: 'development' })).toEqual({
      servidor: 'localhost',
      puerto: 1025,
      exigirTls: false,
      remitente: 'La Previa <avisos@laprevia.test>',
    });
  });

  it('en producción lee el servidor, las credenciales y el remitente, y exige TLS', () => {
    expect(leerConfiguracionDeCorreo(PRODUCCION)).toEqual({
      servidor: 'email-smtp.us-east-1.amazonaws.com',
      puerto: 587,
      usuario: 'usuario-smtp',
      contrasena: 'clave-smtp',
      exigirTls: true,
      remitente: 'La Previa <avisos@dominio-del-local.pe>',
    });
  });

  it.each([
    'SMTP_SERVIDOR',
    'SMTP_USUARIO',
    'SMTP_CONTRASENA',
    'CORREO_REMITENTE',
  ])('en producción falla si falta %s', (variable) => {
    expect(() =>
      leerConfiguracionDeCorreo({ ...PRODUCCION, [variable]: '' }),
    ).toThrow(`Falta la variable de entorno ${variable}.`);
  });

  it('rechaza un puerto que no es número', () => {
    expect(() =>
      leerConfiguracionDeCorreo({ ...PRODUCCION, SMTP_PUERTO: '58a' }),
    ).toThrow('SMTP_PUERTO debe ser un número entero.');
  });

  it('rechaza un remitente sin dirección de correo válida', () => {
    expect(() =>
      leerConfiguracionDeCorreo({
        ...PRODUCCION,
        CORREO_REMITENTE: 'La Previa',
      }),
    ).toThrow(
      'CORREO_REMITENTE debe tener la forma «Nombre <correo@dominio>».',
    );
  });
});
