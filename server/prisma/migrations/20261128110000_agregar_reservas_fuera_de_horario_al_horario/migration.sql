-- AlterTable
ALTER TABLE "horario_de_atencion" ADD COLUMN     "reservas_fuera_de_horario" TEXT[] DEFAULT ARRAY[]::TEXT[];

