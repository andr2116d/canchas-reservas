import { render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { unaConstancia } from "../../../../test/features/libro-de-reclamaciones/constancia-de-prueba";
import { registrarHoja } from "../servicios/libro.api";
import { FormularioDelLibro } from "./formulario-del-libro";

vi.mock("../servicios/libro.api", () => ({ registrarHoja: vi.fn() }));
const registrarSimulado = vi.mocked(registrarHoja);

const campo = (etiqueta: string) => screen.getByLabelText(new RegExp(`^${etiqueta}`));
const continuar = (persona: UserEvent) => persona.click(screen.getByRole("button", { name: "Continuar" }));

async function llenarTusDatos(persona: UserEvent) {
  await persona.type(campo("Número de documento"), "45871236");
  await persona.type(campo("Nombres"), "Valeria");
  await persona.type(campo("Apellidos"), "León Paredes");
  await persona.type(campo("Domicilio"), "Av. América Sur 1250, Trujillo");
  await persona.type(campo("Teléfono"), "987654321");
  await persona.type(campo("Correo"), "valeria.leon@gmail.com");
}

async function llegarAlUltimoPaso(persona: UserEvent) {
  await llenarTusDatos(persona);
  await continuar(persona);
  await persona.click(screen.getByLabelText("Reserva de cancha"));
  await continuar(persona);
  await persona.click(screen.getByRole("radio", { name: /Reclamo/ }));
  await persona.type(campo("¿Qué pasó\\?"), "La cancha estaba ocupada.");
  await persona.type(campo("¿Qué pides\\?"), "Que devuelvan el adelanto.");
  await persona.click(screen.getByLabelText("Por correo"));
  await persona.click(screen.getByRole("checkbox", { name: /Confirmo que mis datos son correctos/ }));
}

describe("FormularioDelLibro", () => {
  beforeEach(() => registrarSimulado.mockReset());

  it("no avanza al siguiente paso si faltan datos y dice cuáles", async () => {
    const persona = userEvent.setup();
    render(<FormularioDelLibro />);

    await continuar(persona);

    expect(screen.getByRole("heading", { name: "Tus datos" })).toBeInTheDocument();
    expect(campo("Nombres")).toHaveAccessibleDescription("Ingresa tus nombres.");
    expect(campo("Número de documento")).toHaveAccessibleDescription("Ingresa tu número de documento.");
  });

  it("si es menor de edad pide los datos de su padre, madre o representante", async () => {
    const persona = userEvent.setup();
    render(<FormularioDelLibro />);
    await llenarTusDatos(persona);

    await persona.click(screen.getByRole("checkbox", { name: "Soy menor de edad" }));
    await continuar(persona);

    const grupo = screen.getByRole("group", { name: "Tu padre, madre o representante" });
    expect(within(grupo).getByLabelText(/^Nombres y apellidos/)).toHaveAccessibleDescription(
      "Ingresa el nombre de tu padre, madre o representante.",
    );
  });

  it("con sesión de jugador empieza con los datos de la cuenta, menos el domicilio", () => {
    render(<FormularioDelLibro cuenta={{ nombres: "Valeria", correo: "valeria.leon@gmail.com", numeroDocumento: "45871236" }} />);

    expect(campo("Nombres")).toHaveValue("Valeria");
    expect(campo("Correo")).toHaveValue("valeria.leon@gmail.com");
    expect(campo("Domicilio")).toHaveValue("");
  });

  it("envía la hoja en tres pasos y muestra la constancia con el número y el código", async () => {
    const persona = userEvent.setup();
    registrarSimulado.mockResolvedValue({ tipo: "aceptado", cuerpo: unaConstancia() });
    render(<FormularioDelLibro />);
    await llegarAlUltimoPaso(persona);

    await persona.click(screen.getByRole("button", { name: "Enviar hoja" }));

    expect(registrarSimulado).toHaveBeenCalledWith(
      expect.objectContaining({ servicio: "RESERVA_DE_CANCHA", tipo: "RECLAMO", medioDeRespuesta: "CORREO", esMenorDeEdad: false }),
    );
    expect(registrarSimulado.mock.calls[0][0]).not.toHaveProperty("conforme");
    expect(await screen.findByRole("heading", { name: "Registramos tu hoja" })).toBeInTheDocument();
    expect(screen.getByText("000014-2026")).toBeInTheDocument();
    expect(screen.getByText("K7QP-4ZMD")).toBeInTheDocument();
    expect(screen.getByText(/Te enviamos una copia a v•••@gmail.com/)).toBeInTheDocument();
  });

  it("si el server rechaza un dato del primer paso, vuelve a ese paso y lo marca", async () => {
    const persona = userEvent.setup();
    registrarSimulado.mockResolvedValue({
      tipo: "rechazado",
      estado: 400,
      mensaje: "Revisa los datos marcados.",
      errores: { correo: "El correo no tiene un formato válido." },
    });
    render(<FormularioDelLibro />);
    await llegarAlUltimoPaso(persona);

    await persona.click(screen.getByRole("button", { name: "Enviar hoja" }));

    expect(await screen.findByRole("heading", { name: "Tus datos" })).toBeInTheDocument();
    expect(campo("Correo")).toHaveAccessibleDescription(/El correo no tiene un formato válido\./);
  });

  it("sin conexión lo avisa y conserva lo escrito", async () => {
    const persona = userEvent.setup();
    registrarSimulado.mockResolvedValue({ tipo: "sin-conexion", mensaje: "No pudimos conectar con La Previa." });
    render(<FormularioDelLibro />);
    await llegarAlUltimoPaso(persona);

    await persona.click(screen.getByRole("button", { name: "Enviar hoja" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectar con La Previa.");
    expect(campo("¿Qué pasó\\?")).toHaveValue("La cancha estaba ocupada.");
  });
});
