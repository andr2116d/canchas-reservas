import { describe, expect, it } from "vitest";
import { aDatosDeLaHoja, esquemaDeLaHoja, hojaEnBlanco, pasoDelCampo, type FormularioDeLaHoja } from "./hoja.schema";

function unaHoja(cambios: Partial<FormularioDeLaHoja> = {}): FormularioDeLaHoja {
  return {
    ...hojaEnBlanco(),
    numeroDocumento: "45871236",
    nombres: "Valeria",
    apellidos: "León Paredes",
    domicilio: "Av. América Sur 1250, Trujillo",
    telefono: "987 654 321",
    correo: "valeria.leon@gmail.com",
    servicio: "RESERVA_DE_CANCHA",
    tipo: "RECLAMO",
    detalle: "La cancha estaba ocupada.",
    pedido: "Que devuelvan el adelanto.",
    medioDeRespuesta: "CORREO",
    conforme: true,
    ...cambios,
  };
}

const errores = (hoja: FormularioDeLaHoja) => {
  const resultado = esquemaDeLaHoja.safeParse(hoja);
  return resultado.success ? {} : Object.fromEntries(resultado.error.issues.map((i) => [i.path[0], i.message]));
};

describe("esquemaDeLaHoja", () => {
  it("acepta una hoja completa", () => {
    expect(errores(unaHoja())).toEqual({});
  });

  it("pide lo que falta con mensajes en segunda persona", () => {
    expect(errores(hojaEnBlanco())).toMatchObject({
      numeroDocumento: "Ingresa tu número de documento.",
      nombres: "Ingresa tus nombres.",
      domicilio: "Ingresa tu domicilio.",
      telefono: "Ingresa tu teléfono.",
      correo: "Ingresa tu correo.",
      servicio: "Elige qué contrataste.",
      tipo: "Elige si es un reclamo o una queja.",
      detalle: "Cuéntanos qué pasó.",
      pedido: "Dinos qué pides.",
      medioDeRespuesta: "Elige cómo quieres recibir la respuesta.",
      conforme: "Confirma que tus datos son correctos para enviar la hoja.",
    });
  });

  it("acepta un teléfono fijo con código de ciudad y rechaza uno corto", () => {
    expect(errores(unaHoja({ telefono: "044-123456" }))).toEqual({});
    expect(errores(unaHoja({ telefono: "12345" })).telefono).toMatch(/7 a 9 dígitos/);
  });

  it("si es menor de edad, pide los datos de su padre, madre o representante", () => {
    expect(Object.keys(errores(unaHoja({ esMenorDeEdad: true })))).toEqual([
      "representanteNombre",
      "representanteDomicilio",
      "representanteTelefono",
      "representanteCorreo",
    ]);
  });

  it("el monto es opcional pero, si se escribe, debe ser un monto en soles", () => {
    expect(errores(unaHoja({ montoReclamado: "" }))).toEqual({});
    expect(errores(unaHoja({ montoReclamado: "40.555" })).montoReclamado).toBeDefined();
  });
});

describe("aDatosDeLaHoja", () => {
  it("no envía la confirmación ni los datos de representante si no es menor de edad", () => {
    const datos = aDatosDeLaHoja(unaHoja({ representanteNombre: "Rosa" }));

    expect(datos).not.toHaveProperty("conforme");
    expect(datos).not.toHaveProperty("representanteNombre");
  });

  it("ubica cada campo en su paso", () => {
    expect([pasoDelCampo("correo"), pasoDelCampo("montoReclamado"), pasoDelCampo("pedido")]).toEqual([0, 1, 2]);
  });
});
