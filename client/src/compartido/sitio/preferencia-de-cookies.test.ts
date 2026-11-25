import { afterEach, describe, expect, it, vi } from "vitest";
import { abrirPreferencias, estadoDelAviso, guardarPreferencia, leerPreferencia, suscribirAlAviso } from "./preferencia-de-cookies";

describe("preferencia de cookies", () => {
  afterEach(() => {
    document.cookie = "preferencia_de_cookies=; max-age=0; path=/";
  });

  it("sin elegir no hay preferencia y el aviso se muestra", () => {
    expect(leerPreferencia()).toBeUndefined();
    expect(estadoDelAviso()).toBe("visible");
  });

  it("guarda la elección por 180 días y oculta el aviso", () => {
    guardarPreferencia("necesarias");

    expect(leerPreferencia()).toBe("necesarias");
    expect(estadoDelAviso()).toBe("oculto");
  });

  it("ignora un valor que no reconoce", () => {
    document.cookie = "preferencia_de_cookies=cualquiera; path=/";

    expect(leerPreferencia()).toBeUndefined();
  });

  it("desde el pie se vuelve a abrir el aviso aunque ya se haya elegido", () => {
    const avisar = vi.fn();
    const dejar = suscribirAlAviso(avisar);
    guardarPreferencia("todas");

    abrirPreferencias();

    expect(estadoDelAviso()).toBe("visible");
    expect(avisar).toHaveBeenCalled();
    dejar();
  });
});
