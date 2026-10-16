import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioRegistro } from "./components/formulario-registro";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/registro",
}));

const CAMPOS = [
  { etiqueta: "Nombres", valor: "Lucía" },
  { etiqueta: "Apellidos", valor: "Ramírez Torres" },
  { etiqueta: "Tipo de documento", valor: "DNI" },
  { etiqueta: "Número de documento", valor: "71234567" },
  { etiqueta: "Correo", valor: "lucia@correo.com" },
  { etiqueta: "Celular", valor: "987654321" },
  { etiqueta: "Contraseña", valor: "Cancha2026" },
  { etiqueta: "Confirmar contraseña", valor: "Cancha2026" },
] as const;

type LlamadaFetch = [string, RequestInit];

function responder(status: number, cuerpo?: unknown) {
  const fetchMock = vi.fn<(...args: LlamadaFetch) => Promise<Response>>(async () =>
    new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderizar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <FormularioRegistro />
    </QueryClientProvider>,
  );
}

function mensajeDe(etiqueta: string) {
  const campo = screen.getByLabelText(etiqueta);
  return document.getElementById(campo.getAttribute("aria-describedby") ?? "")?.textContent;
}

function llenar(campos: { etiqueta: string; valor: string }[] = [...CAMPOS]) {
  for (const { etiqueta, valor } of campos) {
    const control = screen.getByLabelText(etiqueta);
    const evento = control.tagName === "SELECT" ? fireEvent.change : fireEvent.input;
    evento(control, { target: { value: valor } });
  }
}

const CUERPO_VALIDO = {
  nombres: "Lucía",
  apellidos: "Ramírez Torres",
  tipoDocumento: "DNI",
  numeroDocumento: "71234567",
  correo: "lucia@correo.com",
  telefono: "987654321",
  contrasena: "Cancha2026",
};

beforeEach(() => {
  router.replace.mockReset();
  router.push.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FormularioRegistro", () => {
  it("muestra el mensaje de cada campo inválido al enviar", async () => {
    responder(400);
    renderizar();

    llenar([
      { etiqueta: "Nombres", valor: "L1" },
      { etiqueta: "Apellidos", valor: "X" },
      { etiqueta: "Tipo de documento", valor: "DNI" },
      { etiqueta: "Número de documento", valor: "1234567" },
      { etiqueta: "Correo", valor: "sin-arroba" },
      { etiqueta: "Celular", valor: "812345678" },
      { etiqueta: "Contraseña", valor: "1234567" },
      { etiqueta: "Confirmar contraseña", valor: "otra" },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(mensajeDe("Nombres")).toBe("Ingresa tus nombres"));
    expect(mensajeDe("Apellidos")).toBe("Ingresa tus apellidos");
    expect(mensajeDe("Número de documento")).toBe("El DNI debe tener 8 dígitos");
    expect(mensajeDe("Correo")).toBe("Ingresa un correo válido");
    expect(mensajeDe("Celular")).toBe("Ingresa un celular de 9 dígitos");
    expect(mensajeDe("Contraseña")).toBe("La contraseña debe tener al menos 8 caracteres");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("avisa cuando las contraseñas no coinciden", async () => {
    responder(400);
    renderizar();

    llenar();
    fireEvent.input(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "OtraClave2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(mensajeDe("Confirmar contraseña")).toBe("Las contraseñas no coinciden"),
    );
    expect(mensajeDe("Contraseña")).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("pide elegir el tipo de documento cuando no hay ninguno", async () => {
    responder(400);
    renderizar();

    llenar([{ etiqueta: "Tipo de documento", valor: "" }]);
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(mensajeDe("Tipo de documento")).toBe("Elige el tipo de documento"));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("valida el CE según su formato", async () => {
    responder(201, { id: 7, rol: "JUGADOR" });
    renderizar();

    llenar([{ etiqueta: "Tipo de documento", valor: "CE" }, { etiqueta: "Número de documento", valor: "AB123456" }]);
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(mensajeDe("Número de documento")).toBe(
        "El CE debe tener entre 9 y 12 caracteres alfanuméricos",
      ),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("envía los datos sin la confirmación y lleva a /login con el aviso", async () => {
    const fetchMock = responder(201, { id: 7, rol: "JUGADOR" });
    renderizar();

    llenar();
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login?registro=ok"));
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/registro");
    expect(opciones?.method).toBe("POST");
    expect(JSON.parse(opciones?.body as string)).toEqual(CUERPO_VALIDO);
  });

  it("tras crear la cuenta el formulario queda vacío y sin errores", async () => {
    responder(201, { id: 7, rol: "JUGADOR" });
    renderizar();

    llenar();
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login?registro=ok"));
    await waitFor(() =>
      expect(CAMPOS.map(({ etiqueta }) => (screen.getByLabelText(etiqueta) as HTMLInputElement).value)).toEqual(
        CAMPOS.map(() => ""),
      ),
    );
    for (const { etiqueta } of CAMPOS) {
      expect(screen.getByLabelText(etiqueta).getAttribute("aria-invalid")).toBe("false");
    }
  });

  it("muestra en su campo el error 409 del server sin borrar lo escrito", async () => {
    responder(409, {
      statusCode: 409,
      message: "Este correo ya está registrado",
      errores: {
        correo: "Este correo ya está registrado",
        numeroDocumento: "Este documento ya está registrado",
      },
    });
    renderizar();

    llenar();
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(mensajeDe("Correo")).toBe("Este correo ya está registrado"));
    expect(mensajeDe("Número de documento")).toBe("Este documento ya está registrado");
    expect((screen.getByLabelText("Nombres") as HTMLInputElement).value).toBe("Lucía");
    expect((screen.getByLabelText("Correo") as HTMLInputElement).value).toBe("lucia@correo.com");
    expect(router.replace).not.toHaveBeenCalled();
  });
});
describe("FormularioRegistro: filtros al escribir", () => {
  function campo(etiqueta: string) {
    return screen.getByLabelText(etiqueta) as HTMLInputElement;
  }

  function pegar(control: HTMLInputElement, texto: string) {
    fireEvent.paste(control, { clipboardData: { getData: () => texto } });
    fireEvent.input(control, { target: { value: texto } });
  }

  it("ningún campo es type number", () => {
    renderizar();
    expect(document.querySelector('input[type="number"]')).toBeNull();
    expect(campo("Número de documento").type).toBe("text");
    expect(campo("Celular").type).toBe("tel");
    expect(campo("Celular").inputMode).toBe("numeric");
  });

  it("con DNI el documento no acepta letras ni más de 8 dígitos", () => {
    renderizar();
    llenar([{ etiqueta: "Tipo de documento", valor: "DNI" }]);

    expect(campo("Número de documento").inputMode).toBe("numeric");
    fireEvent.input(campo("Número de documento"), { target: { value: "12a4b" } });
    expect(campo("Número de documento").value).toBe("124");

    pegar(campo("Número de documento"), "12a4b56789");
    expect(campo("Número de documento").value).toBe("12456789");
  });

  it("con CE el documento acepta letras y dígitos hasta 12", () => {
    renderizar();
    llenar([{ etiqueta: "Tipo de documento", valor: "CE" }]);

    expect(campo("Número de documento").inputMode).toBe("text");
    pegar(campo("Número de documento"), "ab-123 456 789 0");
    expect(campo("Número de documento").value).toBe("ab1234567890");
  });

  it("al pasar de CE a DNI recorta lo que no cumple y vuelve a enviar bien", async () => {
    const fetchMock = responder(201, { id: 7, rol: "JUGADOR" });
    renderizar();

    llenar();
    llenar([
      { etiqueta: "Tipo de documento", valor: "CE" },
      { etiqueta: "Número de documento", valor: "AB712345678" },
      { etiqueta: "Tipo de documento", valor: "DNI" },
    ]);
    expect(campo("Número de documento").value).toBe("71234567");

    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual(CUERPO_VALIDO);
  });

  it("con un error visible, cambiar el tipo actualiza el mensaje del documento", async () => {
    renderizar();

    llenar([
      { etiqueta: "Tipo de documento", valor: "CE" },
      { etiqueta: "Número de documento", valor: "AB12" },
    ]);
    fireEvent.blur(campo("Número de documento"));
    await waitFor(() =>
      expect(mensajeDe("Número de documento")).toBe("El CE debe tener entre 9 y 12 caracteres alfanuméricos"),
    );

    llenar([{ etiqueta: "Tipo de documento", valor: "DNI" }]);
    expect(campo("Número de documento").value).toBe("12");
    await waitFor(() => expect(mensajeDe("Número de documento")).toBe("El DNI debe tener 8 dígitos"));
  });

  it("el celular solo acepta dígitos al escribir y al pegar, hasta 9", () => {
    renderizar();

    fireEvent.input(campo("Celular"), { target: { value: "9a8b" } });
    expect(campo("Celular").value).toBe("98");

    pegar(campo("Celular"), "9a8b7-654 321 00");
    expect(campo("Celular").value).toBe("987654321");
  });

  it("sin salir del campo no muestra errores mientras se escribe", () => {
    renderizar();

    fireEvent.input(campo("Celular"), { target: { value: "8" } });
    expect(mensajeDe("Celular")).toBeUndefined();
  });
});
