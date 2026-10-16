import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "@/lib/api";
import { listarAccesos, listarCambios } from "./api";

function responder(status: number, cuerpo?: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })),
  );
}

function pedido() {
  const [url, opciones] = vi.mocked(fetch).mock.calls[0];
  const [ruta, query] = String(url).split("?");
  return { ruta, query: Object.fromEntries(new URLSearchParams(query)), metodo: opciones?.method };
}

const VACIA = { items: [], total: 0, pagina: 1, tamano: 20 };

afterEach(() => vi.unstubAllGlobals());

describe("api de actividad", () => {
  it("cambios manda los filtros, la página y 20 por página por GET", async () => {
    responder(200, VACIA);
    await expect(
      listarCambios({ entidad: "TARIFA", accion: "EDITAR", desde: "2026-10-01", hasta: "2026-10-16", pagina: 2 }),
    ).resolves.toEqual(VACIA);

    expect(pedido()).toEqual({
      ruta: "/api/auditoria",
      query: { entidad: "TARIFA", accion: "EDITAR", desde: "2026-10-01", hasta: "2026-10-16", pagina: "2", tamano: "20" },
      metodo: undefined,
    });
  });

  it("cambios omite los filtros vacíos", async () => {
    responder(200, VACIA);
    await listarCambios({ entidad: "", accion: undefined, desde: "", pagina: 1 });

    expect(pedido().query).toEqual({ pagina: "1", tamano: "20" });
  });

  it.each([
    [true, "true"],
    [false, "false"],
  ])("accesos manda exito=%s y el correo", async (exito, texto) => {
    responder(200, VACIA);
    await listarAccesos({ exito, correo: "ana@", pagina: 1 });

    expect(pedido()).toMatchObject({
      ruta: "/api/accesos",
      query: { exito: texto, correo: "ana@", pagina: "1", tamano: "20" },
    });
  });

  it("accesos sin resultado elegido no manda exito", async () => {
    responder(200, VACIA);
    await listarAccesos({ pagina: 3, desde: "2026-10-16" });

    expect(pedido().query).toEqual({ pagina: "3", desde: "2026-10-16", tamano: "20" });
  });

  it("un 400 trae los errores por campo", async () => {
    responder(400, {
      statusCode: 400,
      message: "La fecha hasta no puede ser anterior a la fecha desde",
      errores: { hasta: "La fecha hasta no puede ser anterior a la fecha desde" },
    });

    const error = await listarCambios({ desde: "2026-10-16", hasta: "2026-10-01", pagina: 1 }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).errores).toEqual({ hasta: "La fecha hasta no puede ser anterior a la fecha desde" });
  });
});
