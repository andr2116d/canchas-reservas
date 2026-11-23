import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearRecepcionista, reactivarRecepcionista, sugerirCorreo } from "../servicios/recepcionistas.api";
import { FormularioDeAlta } from "./formulario-de-alta";

const navegar = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegar }));
vi.mock("../servicios/recepcionistas.api", () => ({
  crearRecepcionista: vi.fn(),
  reactivarRecepcionista: vi.fn(),
  sugerirCorreo: vi.fn(),
}));

async function llenar(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText(/^Nombres/), "Rosa");
  await usuario.type(screen.getByLabelText(/^Apellidos/), "Quispe Lozano");
  await usuario.type(screen.getByLabelText(/^Fecha de nacimiento/), "1995-02-01");
  await usuario.type(screen.getByLabelText(/^Número de documento/), "41234567");
  await usuario.type(screen.getByLabelText(/^Celular/), "912345678");
  await usuario.type(screen.getByLabelText(/^Correo institucional/), "rosa.quispe");
  await usuario.type(screen.getByLabelText(/^Contraseña temporal/), "temporal2026");
}

describe("FormularioDeAlta", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it("genera el correo institucional con los nombres y apellidos", async () => {
    vi.mocked(sugerirCorreo).mockResolvedValue("rosa.quispe");
    const usuario = userEvent.setup();
    render(<FormularioDeAlta dominio="laprevia.pe" />);
    await usuario.type(screen.getByLabelText(/^Nombres/), "Rosa");
    await usuario.type(screen.getByLabelText(/^Apellidos/), "Quispe Lozano");

    await usuario.click(screen.getByRole("button", { name: "Generar correo" }));

    expect(sugerirCorreo).toHaveBeenCalledWith("Rosa", "Quispe Lozano");
    expect(screen.getByLabelText(/^Correo institucional/)).toHaveValue("rosa.quispe");
    expect(screen.getByText("@laprevia.pe")).toBeInTheDocument();
  });

  it("genera una contraseña temporal válida", async () => {
    const usuario = userEvent.setup();
    render(<FormularioDeAlta dominio="laprevia.pe" />);

    await usuario.click(screen.getByRole("button", { name: "Generar contraseña" }));

    expect((screen.getByLabelText(/^Contraseña temporal/) as HTMLInputElement).value).toMatch(/^(?=.*\d)[A-Za-z\d]{10}$/);
  });

  it("crea la cuenta y muestra las credenciales para entregarlas", async () => {
    vi.mocked(crearRecepcionista).mockResolvedValue({ tipo: "creada", id: 7 });
    const usuario = userEvent.setup();
    render(<FormularioDeAlta dominio="laprevia.pe" />);
    await llenar(usuario);

    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(crearRecepcionista).toHaveBeenCalledWith(expect.objectContaining({ usuarioDeCorreo: "rosa.quispe" }));
    expect(await screen.findByRole("heading", { name: "Cuenta creada" })).toBeInTheDocument();
    expect(screen.getByText("rosa.quispe@laprevia.pe")).toBeInTheDocument();
    expect(screen.getByText("temporal2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver su ficha" })).toHaveAttribute("href", "/administracion/recepcionistas/7");
  });

  it("marca junto a cada campo los datos repetidos", async () => {
    vi.mocked(crearRecepcionista).mockResolvedValue({
      tipo: "datos-rechazados",
      errores: { usuarioDeCorreo: "Este correo ya fue registrado para otra cuenta del personal." },
    });
    const usuario = userEvent.setup();
    render(<FormularioDeAlta dominio="laprevia.pe" />);
    await llenar(usuario);

    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("Este correo ya fue registrado para otra cuenta del personal.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Correo institucional/)).toHaveAttribute("aria-invalid", "true");
  });

  it("ofrece reactivar la cuenta desactivada con la contraseña temporal escrita", async () => {
    vi.mocked(crearRecepcionista).mockResolvedValue({ tipo: "reactivable", id: 3, nombres: "Rosa" });
    vi.mocked(reactivarRecepcionista).mockResolvedValue({ tipo: "hecho" });
    const usuario = userEvent.setup();
    render(<FormularioDeAlta dominio="laprevia.pe" />);
    await llenar(usuario);
    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    const aviso = await screen.findByRole("alertdialog");
    expect(aviso).toHaveTextContent("Rosa ya tuvo una cuenta de recepción");
    await usuario.click(screen.getByRole("button", { name: "Reactivar su cuenta" }));

    expect(reactivarRecepcionista).toHaveBeenCalledWith(3, "temporal2026");
    await waitFor(() => expect(navegar.push).toHaveBeenCalledWith("/administracion/recepcionistas/3"));
  });
});
