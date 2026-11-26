import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { enviarJson } from "../api/enviar-json";
import { ContadorDeReclamos } from "./contador-de-reclamos";

vi.mock("next/navigation", () => ({ usePathname: () => "/administracion" }));
vi.mock("../avisos/canal-de-avisos", () => ({ escucharAvisos: () => () => undefined }));
vi.mock("../api/enviar-json", () => ({ enviarJson: vi.fn() }));
const consultar = vi.mocked(enviarJson);

describe("ContadorDeReclamos", () => {
  beforeEach(() => consultar.mockReset());

  it("muestra cuántas hojas faltan responder y contiene su texto oculto", async () => {
    consultar.mockResolvedValue({ tipo: "aceptado", cuerpo: { conteos: { POR_RESPONDER: 3 } } });

    render(<ContadorDeReclamos />);

    const contador = (await screen.findByText("por responder")).parentElement!;
    expect(contador).toHaveTextContent("3 por responder");
    expect(contador).toHaveClass("relative");
  });

  it("sin hojas pendientes no se muestra", async () => {
    consultar.mockResolvedValue({ tipo: "aceptado", cuerpo: { conteos: { POR_RESPONDER: 0 } } });

    const { container } = render(<ContadorDeReclamos />);

    await vi.waitFor(() => expect(consultar).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
