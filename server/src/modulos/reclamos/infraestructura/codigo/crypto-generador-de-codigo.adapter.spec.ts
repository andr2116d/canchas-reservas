import {
  ALFABETO_DEL_CODIGO,
  leerCodigo,
} from '../../dominio/codigo-de-seguimiento';
import { CryptoGeneradorDeCodigoAdapter } from './crypto-generador-de-codigo.adapter';

describe('CryptoGeneradorDeCodigoAdapter', () => {
  const generador = new CryptoGeneradorDeCodigoAdapter();

  it('da códigos de 8 caracteres del alfabeto del código', () => {
    const codigo = generador.generar();

    expect(leerCodigo(codigo)).toBe(codigo);
    expect(codigo.split('').every((c) => ALFABETO_DEL_CODIGO.includes(c))).toBe(
      true,
    );
  });

  it('no repite códigos', () => {
    const codigos = new Set(
      Array.from({ length: 1000 }, () => generador.generar()),
    );

    expect(codigos.size).toBe(1000);
  });
});
