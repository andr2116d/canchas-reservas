import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { unaHojaParaAtender } from "../../../../test/features/reclamos/hoja-de-prueba";
import { abrirHoja, clasificarHoja, responderHoja, tramitarComoReclamo } from "../servicios/reclamos.api";
import { AtencionDeLaHoja } from "./atencion-de-la-hoja";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../servicios/reclamos.api", () => ({ abrirHoja: vi.fn(), clasificarHoja: vi.fn(), tramitarComoReclamo: vi.fn(), responderHoja: vi.fn() }));
const abrir = vi.mocked(abrirHoja);
const clasificar = vi.mocked(clasificarHoja);
const tramitar = vi.mocked(tramitarComoReclamo);
const responder = vi.mocked(responderHoja);
const aceptado = (cambios: Parameters<typeof unaHojaParaAtender>[0]) => ({ tipo: "aceptado" as const, cuerpo: unaHojaParaAtender(cambios) });

describe("AtencionDeLaHoja", () => {
  beforeEach(() => vi.clearAllMocks());

  it("al abrir una hoja nueva la pasa a «en atención»", async () => {
    abrir.mockResolvedValue(aceptado({ estado: "EN_ATENCION", cambios: [{ accion: "APERTURA", ejecutadoPor: "Valeria León Paredes", ocurridoEn: "2026-11-26T14:00:00.000Z", detalle: null }] }));

    render(<AtencionDeLaHoja inicial={unaHojaParaAtender()} />);

    await waitFor(() => expect(abrir).toHaveBeenCalledWith("000014-2026"));
    expect(await screen.findByText("En atención")).toBeInTheDocument();
    expect(screen.getByText(/La abrió: pasó a «en atención»/)).toBeInTheDocument();
  });

  it("una hoja ya abierta no se vuelve a abrir", () => {
    render(<AtencionDeLaHoja inicial={unaHojaParaAtender({ estado: "EN_ATENCION" })} />);

    expect(abrir).not.toHaveBeenCalled();
  });

  it("clasifica por motivo al elegirlo", async () => {
    const persona = userEvent.setup();
    clasificar.mockResolvedValue(aceptado({ estado: "EN_ATENCION", motivo: "ESTADO_DE_LA_CANCHA" }));
    render(<AtencionDeLaHoja inicial={unaHojaParaAtender({ estado: "EN_ATENCION" })} />);

    await persona.selectOptions(screen.getByLabelText("Motivo"), "ESTADO_DE_LA_CANCHA");

    expect(clasificar).toHaveBeenCalledWith("000014-2026", "ESTADO_DE_LA_CANCHA");
    expect(await screen.findAllByText("Estado de la cancha")).not.toHaveLength(0);
  });

  it("una queja se puede tramitar como reclamo", async () => {
    const persona = userEvent.setup();
    tramitar.mockResolvedValue(aceptado({ estado: "EN_ATENCION", tipo: "RECLAMO", tipoMarcado: "QUEJA" }));
    render(<AtencionDeLaHoja inicial={unaHojaParaAtender({ estado: "EN_ATENCION", tipo: "QUEJA", tipoMarcado: "QUEJA" })} />);

    await persona.click(screen.getByRole("button", { name: "Tramitar como reclamo" }));

    expect(await screen.findByText(/La persona la marcó como queja/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tramitar como reclamo" })).not.toBeInTheDocument();
  });

  it("responder pide confirmar y después muestra la respuesta fija", async () => {
    const persona = userEvent.setup();
    responder.mockResolvedValue(aceptado({ estado: "RESPONDIDA", respuesta: { texto: "Devolvimos el adelanto.", respondidaEn: "2026-12-01T21:00:00.000Z", cartaEnviadaEl: null } }));
    render(<AtencionDeLaHoja inicial={unaHojaParaAtender({ estado: "EN_ATENCION" })} />);

    await persona.type(screen.getByLabelText(/^Acciones adoptadas/), "Devolvimos el adelanto.");
    await persona.click(screen.getByRole("button", { name: "Revisar y enviar" }));
    expect(responder).not.toHaveBeenCalled();
    await persona.click(screen.getByRole("button", { name: "Enviar respuesta" }));

    expect(responder).toHaveBeenCalledWith("000014-2026", { texto: "Devolvimos el adelanto." });
    expect(await screen.findByRole("heading", { name: "Respuesta" })).toBeInTheDocument();
    expect(screen.getByText(/La respuesta no se edita/)).toBeInTheDocument();
  });

  it("por carta pide la fecha de envío antes de confirmar", async () => {
    const persona = userEvent.setup();
    render(<AtencionDeLaHoja inicial={unaHojaParaAtender({ estado: "EN_ATENCION", medioDeRespuesta: "CARTA" })} />);

    await persona.type(screen.getByLabelText(/^Acciones adoptadas/), "Respuesta.");
    await persona.click(screen.getByRole("button", { name: "Revisar y enviar" }));

    expect(screen.getByLabelText(/^Fecha de envío de la carta/)).toHaveAccessibleDescription(/Indica la fecha en que enviaste la carta\./);
  });

  it("si otra persona ya la respondió, lo avisa", async () => {
    const persona = userEvent.setup();
    responder.mockResolvedValue({ tipo: "rechazado", estado: 409, mensaje: "La hoja ya fue respondida. La respuesta no se cambia.", errores: {} });
    render(<AtencionDeLaHoja inicial={unaHojaParaAtender({ estado: "EN_ATENCION" })} />);

    await persona.type(screen.getByLabelText(/^Acciones adoptadas/), "Otra.");
    await persona.click(screen.getByRole("button", { name: "Revisar y enviar" }));
    await persona.click(screen.getByRole("button", { name: "Enviar respuesta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La hoja ya fue respondida.");
  });
});
