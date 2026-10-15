import { permitirConexion } from './adaptador-socket-io';

describe('permitirConexion', () => {
  const original = process.env.CLIENT_URL;

  beforeEach(() => {
    process.env.CLIENT_URL = 'http://localhost:3000';
  });

  afterAll(() => {
    if (original === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = original;
  });

  function evaluar(origin?: string) {
    const responder = jest.fn();
    permitirConexion({ headers: { origin } }, responder);
    return responder;
  }

  it('acepta el origen de CLIENT_URL', () => {
    expect(evaluar('http://localhost:3000')).toHaveBeenCalledWith(null, true);
  });

  it('rechaza otro origen', () => {
    expect(evaluar('http://otro.com')).toHaveBeenCalledWith(
      'Origen no permitido',
      false,
    );
  });

  it('rechaza una petición sin origen', () => {
    expect(evaluar()).toHaveBeenCalledWith('Origen no permitido', false);
  });
});
