import { IsString, ValidateBy } from 'class-validator';

export const MENSAJE_FECHA = 'La fecha debe tener el formato YYYY-MM-DD';

const FechaValida = () =>
  ValidateBy({
    name: 'fechaValida',
    validator: {
      validate: (fecha: unknown) => {
        if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          return false;
        }
        const dia = new Date(`${fecha}T00:00:00.000Z`);
        return (
          !Number.isNaN(dia.getTime()) &&
          dia.toISOString().slice(0, 10) === fecha
        );
      },
      defaultMessage: () => MENSAJE_FECHA,
    },
  });

export class VistaPreviaDto {
  @FechaValida()
  @IsString({ message: MENSAJE_FECHA })
  fecha!: string;
}
