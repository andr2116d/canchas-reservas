import type { Cuenta } from "@/compartido/cuenta/cuenta.servidor";

const NOMBRE_DEL_DOCUMENTO = { DNI: "DNI", CARNE_EXTRANJERIA: "Carné de extranjería" } as const;

function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

/** Datos que identifican a la persona: se ven, pero no se cambian desde la cuenta. */
export function DatosDeIdentidad({ cuenta }: { cuenta: Cuenta }) {
  const quienCorrige = cuenta.rol === "JUGADOR" ? "pide a recepción que los corrija" : "pide a administración que los corrija";
  const filas = [
    ["Nombre", `${cuenta.nombres} ${cuenta.apellidos}`],
    ["Documento", cuenta.tipoDocumento && `${NOMBRE_DEL_DOCUMENTO[cuenta.tipoDocumento]} ${cuenta.numeroDocumento}`],
    ["Fecha de nacimiento", cuenta.fechaNacimiento && fechaLegible(cuenta.fechaNacimiento)],
  ].filter((fila): fila is [string, string] => Boolean(fila[1]));

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid gap-x-6 gap-y-2 rounded-xl bg-tiza p-4 sm:grid-cols-[auto_1fr]">
        {filas.map(([dato, valor]) => (
          <div key={dato} className="contents">
            <dt className="text-sm font-semibold text-grava">{dato}</dt>
            <dd className="font-bold text-tinta">{valor}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-grava">Estos datos te identifican. Si alguno está mal, {quienCorrige}.</p>
    </div>
  );
}
