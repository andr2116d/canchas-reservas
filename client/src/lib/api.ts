export class ErrorApi extends Error {
  constructor(
    public status: number,
    message: string,
    public errores: Record<string, string> = {},
    public datos?: unknown,
  ) {
    super(message);
    this.name = "ErrorApi";
  }
}

type Opciones = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T>(ruta: string, { body, headers, ...resto }: Opciones = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      ...resto,
      credentials: "include",
      headers: { ...(body !== undefined && { "Content-Type": "application/json" }), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ErrorApi(0, "No se pudo conectar con el servidor");
  }

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : undefined;

  if (!respuesta.ok) {
    const mensaje = Array.isArray(datos?.message) ? datos.message[0] : datos?.message;
    throw new ErrorApi(respuesta.status, mensaje ?? "Ocurrió un error", datos?.errores ?? {}, datos);
  }
  return datos as T;
}
