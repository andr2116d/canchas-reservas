import { describe, expect, it, vi } from "vitest";
import { alfanumerico, conFiltro, decimal, filtroDocumento, soloDigitos } from "./filtros-entrada";

describe("filtros de entrada", () => {
  it("soloDigitos deja solo cifras y respeta el máximo", () => {
    expect(soloDigitos("12a4b56789")).toBe("12456789");
    expect(soloDigitos("9a8b7-654 321")).toBe("987654321");
    expect(soloDigitos("9a8b7-654 321", 8)).toBe("98765432");
    expect(soloDigitos("12.345")).toBe("12345");
    expect(soloDigitos("1,5")).toBe("15");
    expect(soloDigitos("abc")).toBe("");
    expect(soloDigitos("")).toBe("");
  });

  it("alfanumerico deja letras y cifras y respeta el máximo", () => {
    expect(alfanumerico("12a4b56789")).toBe("12a4b56789");
    expect(alfanumerico("9a8b7-654 321")).toBe("9a8b7654321");
    expect(alfanumerico("9a8b7-654 321", 6)).toBe("9a8b76");
    expect(alfanumerico("12.345")).toBe("12345");
    expect(alfanumerico("1,5")).toBe("15");
    expect(alfanumerico("abc")).toBe("abc");
    expect(alfanumerico("ñandú")).toBe("and");
  });

  it("decimal deja cifras y un punto con hasta 2 decimales", () => {
    expect(decimal("12a4b56789")).toBe("12456789");
    expect(decimal("9a8b7-654 321")).toBe("987654321");
    expect(decimal("12.345")).toBe("12.34");
    expect(decimal("1,5")).toBe("1.5");
    expect(decimal("abc")).toBe("");
    expect(decimal("-5")).toBe("5");
    expect(decimal("1.2.345")).toBe("1.23");
    expect(decimal("1e3")).toBe("13");
    expect(decimal(".")).toBe(".");
  });

  it("filtroDocumento usa 8 dígitos para DNI y 12 alfanuméricos para CE", () => {
    expect(filtroDocumento("DNI")("AB123456789")).toBe("12345678");
    expect(filtroDocumento("CE")("ab-123 456 789 0")).toBe("ab1234567890");
    expect(filtroDocumento("")("ab-123 456 789 0")).toBe("ab1234567890");
  });

  it("conFiltro limpia el campo antes de avisar a React Hook Form", async () => {
    const onChange = vi.fn(async (evento: { target: HTMLInputElement }) => {
      expect(evento.target.value).toBe("987");
    });
    const registro = conFiltro({ name: "telefono", onChange, onBlur: vi.fn(), ref: vi.fn() }, (valor) =>
      soloDigitos(valor, 9),
    );
    const campo = document.createElement("input");
    campo.value = "9a8b7";

    await registro.onChange({ target: campo, type: "change" });

    expect(campo.value).toBe("987");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(registro.name).toBe("telefono");
  });

  it("conFiltro deja el cursor después del último carácter aceptado", async () => {
    const registro = conFiltro({ name: "valor", onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() }, decimal);
    const campo = document.createElement("input");
    document.body.append(campo);
    campo.value = "12x34";
    campo.setSelectionRange(3, 3);

    await registro.onChange({ target: campo, type: "change" });

    expect(campo.value).toBe("1234");
    expect(campo.selectionStart).toBe(2);
    campo.remove();
  });
});
