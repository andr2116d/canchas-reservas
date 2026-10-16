import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';

describe('Errores en español (e2e)', () => {
  let app: INestApplication;

  const servidor = () => app.getHttpServer() as Parameters<typeof request>[0];

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('un campo extra en el body responde 400 con el campo en español', async () => {
    const res = await request(servidor())
      .post('/api/auth/login')
      .send({
        correo: 'nadie@laprevia.test',
        contrasena: 'Clave12345',
        extra: 1,
      })
      .expect(400);

    expect(res.body).toEqual({
      statusCode: 400,
      message: 'El campo extra no está permitido',
      errores: { extra: 'El campo extra no está permitido' },
    });
  });
});
