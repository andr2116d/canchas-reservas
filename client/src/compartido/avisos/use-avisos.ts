"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Aviso, consultarAvisos, marcarAvisoLeido, marcarTodosLeidos } from "./avisos";
import { escucharAvisos } from "./canal-de-avisos";

/** Lo que muestra la campana y cómo pedirlo de nuevo. `nuevo` es el último que llegó con la pantalla abierta. */
function useConsultaDeAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [sinLeer, setSinLeer] = useState(0);
  const [nuevo, setNuevo] = useState<Aviso>();
  const ultimoId = useRef<number | undefined>(undefined);

  const cargar = useCallback(async () => {
    const respuesta = await consultarAvisos();
    if (respuesta.tipo !== "aceptado") return;
    const [masReciente] = respuesta.cuerpo.avisos;
    if (ultimoId.current !== undefined && masReciente && masReciente.id > ultimoId.current && !masReciente.leido) setNuevo(masReciente);
    ultimoId.current = masReciente?.id ?? 0;
    setAvisos(respuesta.cuerpo.avisos);
    setSinLeer(respuesta.cuerpo.sinLeer);
  }, []);
  return { avisos, setAvisos, sinLeer, setSinLeer, nuevo, setNuevo, cargar };
}

/** Los avisos de la persona con sesión, al día: se piden al abrir y cada vez que el canal anuncia uno nuevo. */
export function useAvisos() {
  const { avisos, setAvisos, sinLeer, setSinLeer, nuevo, setNuevo, cargar } = useConsultaDeAvisos();

  useEffect(() => {
    void cargar();
    return escucharAvisos(() => void cargar());
  }, [cargar]);

  async function marcarLeido(id: number) {
    if (avisos.some((a) => a.id === id && !a.leido)) setSinLeer((n) => Math.max(0, n - 1));
    setAvisos((lista) => lista.map((a) => (a.id === id ? { ...a, leido: true } : a)));
    await marcarAvisoLeido(id);
  }
  async function marcarTodos() {
    setAvisos((lista) => lista.map((a) => ({ ...a, leido: true })));
    setSinLeer(0);
    await marcarTodosLeidos();
  }
  return { avisos, sinLeer, nuevo, descartarNuevo: () => setNuevo(undefined), marcarLeido, marcarTodos };
}
