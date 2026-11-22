import { describe, expect, it } from "vitest";
import { type DatosRegistro, esquemaRegistro } from "./registro.schema";

function unRegistroValido(cambios: Partial<DatosRegistro> = {}): DatosRegistro {
  return {
    nombres: "Valeria",
    apellidos: "León Paredes",
    tipoDocumento: "DNI",
    numeroDocumento: "45678912",
    celular: "987654321",
    correo: "valeria.leon@gmail.com",
    contrasena: "pichanga10",
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
