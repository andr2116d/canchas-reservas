import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { type DatosRegistro, esquemaRegistro } from "./registro.schema";

function unRegistroValido(cambios: Partial<DatosRegistro> = {}): DatosRegistro {
  return {
    nombres: "Valeria",
    apellidos: "León Paredes",
    fechaNacimiento: "1998-05-14",
    tipoDocumento: "DNI",
    numeroDocumento: "45678912",
    celular: "987654321",
    correo: "valeria.leon@gmail.com",
    contrasena: "pichanga10",
    dorsal: "",
    versionLegalAceptada: "registro-1",
    ...cambios,
  };
}

/** Devuelve el mensaje de error del campo, o undefined si es válido. */
function errorDe(campo: keyof DatosRegistro, cambios: Partial<DatosRegistro>) {
  const resultado = esquemaRegistro.safeParse(unRegistroValido(cambios));
  if (resultado.success) return undefined;
  return resultado.error.issues.find((issue) => issue.path[0] === campo)
    ?.message;
}

describe("esquemaRegistro", () => {
  // 22 de noviembre de 2026 a las 10:00 en Lima.
  beforeAll(() => vi.setSystemTime(new Date("2026-11-22T15:00:00.000Z")));
  afterAll(() => vi.useRealTimers());

  it("acepta un registro con todos los datos válidos", () => {
    expect(esquemaRegistro.safeParse(unRegistroValido()).success).toBe(true);
  });

  describe("nombres y apellidos", () => {
    it.each([
      ["nombres", "Ingresa tus nombres."],
      ["apellidos", "Ingresa tus apellidos."],
    ] as const)("pide %s si están vacíos", (campo, mensaje) => {
      expect(errorDe(campo, { [campo]: "   " })).toBe(mensaje);
    });

    it("rechaza más de 80 caracteres", () => {
      expect(errorDe("nombres", { nombres: "a".repeat(81) })).toBe(
        "Tus nombres no pueden tener más de 80 caracteres.",
      );
    });
  });

  describe("fecha de nacimiento", () => {
    it("acepta a quien cumple 18 años hoy", () => {
      expect(errorDe("fechaNacimiento", { fechaNacimiento: "2008-11-22" })).toBeUndefined();
    });

    it.each([
      ["2008-11-23", "Debes tener al menos 18 años para crear tu cuenta."],
      ["2027-01-01", "La fecha de nacimiento no puede ser futura."],
      ["1899-12-31", "Revisa el año de tu fecha de nacimiento."],
      ["1998-02-30", "La fecha de nacimiento no es válida."],
      ["", "Ingresa tu fecha de nacimiento."],
    ])('rechaza "%s": %s', (fechaNacimiento, mensaje) => {
      expect(errorDe("fechaNacimiento", { fechaNacimiento })).toBe(mensaje);
    });
  });

  describe("dorsal", () => {
    it.each(["", "7", "10", "99"])('acepta "%s" (es opcional)', (dorsal) => {
      expect(errorDe("dorsal", { dorsal })).toBeUndefined();
    });

    it.each([
      ["1O", "El dorsal solo debe contener números."],
      ["0", "El dorsal debe estar entre 1 y 99."],
      ["100", "El dorsal debe estar entre 1 y 99."],
    ])('rechaza "%s": %s', (dorsal, mensaje) => {
      expect(errorDe("dorsal", { dorsal })).toBe(mensaje);
    });
  });

  describe("DNI", () => {
    it.each([
      ["4567891A", "El DNI solo debe contener números."],
      ["1234567", "El DNI debe tener 8 dígitos."],
      ["123456789", "El DNI debe tener 8 dígitos."],
      ["", "Ingresa tu número de documento."],
    ])('rechaza "%s": %s', (numeroDocumento, mensaje) => {
      expect(errorDe("numeroDocumento", { numeroDocumento })).toBe(mensaje);
    });
  });

  it("valida el documento aunque otros campos sigan vacíos", () => {
    expect(
      errorDe("numeroDocumento", {
        numeroDocumento: "4567891A",
        celular: "",
        correo: "",
        contrasena: "",
      }),
    ).toBe("El DNI solo debe contener números.");
  });

  describe("carné de extranjería", () => {
    it.each(["001234567", "ab1234567", "123456789012"])('acepta "%s"', (numero) => {
      expect(
        errorDe("numeroDocumento", {
          tipoDocumento: "CARNE_EXTRANJERIA",
          numeroDocumento: numero,
        }),
      ).toBeUndefined();
    });

    it.each([
      ["AB-123456", "El carné de extranjería solo admite letras y números."],
      ["12345678", "El carné de extranjería debe tener entre 9 y 12 caracteres."],
    ])('rechaza "%s": %s', (numeroDocumento, mensaje) => {
      expect(
        errorDe("numeroDocumento", {
          tipoDocumento: "CARNE_EXTRANJERIA",
          numeroDocumento,
        }),
      ).toBe(mensaje);
    });
  });

  describe("celular", () => {
    it.each([
      ["98765432A", "El celular solo debe contener números."],
      ["044123456", "El celular debe empezar con 9."],
      ["98765432", "El celular debe tener 9 dígitos."],
      ["", "Ingresa tu número de celular."],
    ])('rechaza "%s": %s', (celular, mensaje) => {
      expect(errorDe("celular", { celular })).toBe(mensaje);
    });
  });

  describe("correo", () => {
    it.each(["ana", "ana@gmail", "ana@@gmail.com", "ana rojas@gmail.com"])(
      'rechaza "%s" por formato',
      (correo) => {
        expect(errorDe("correo", { correo })).toBe(
          "El correo no tiene un formato válido.",
        );
      },
    );

    it("pide el correo si está vacío", () => {
      expect(errorDe("correo", { correo: "" })).toBe("Ingresa tu correo.");
    });
  });

  describe("contraseña", () => {
    it.each([
      ["pichanga", "La contraseña debe incluir al menos un número."],
      ["corta1", "La contraseña debe tener al menos 8 caracteres."],
      ["a1".repeat(32) + "x", "La contraseña no puede tener más de 64 caracteres."],
      ["", "Ingresa una contraseña."],
    ])('rechaza "%s": %s', (contrasena, mensaje) => {
      expect(errorDe("contrasena", { contrasena })).toBe(mensaje);
    });
  });
});
