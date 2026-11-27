-- CreateEnum
CREATE TYPE "canal_de_reserva" AS ENUM ('web');

-- AlterEnum
ALTER TYPE "estado_de_reserva" ADD VALUE 'expirada';

-- DropIndex
DROP INDEX "reserva_titular_id_idx";

-- AlterTable
ALTER TABLE "reserva" ADD COLUMN     "adelanto" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "canal" "canal_de_reserva" NOT NULL,
ADD COLUMN     "codigo" TEXT NOT NULL,
ADD COLUMN     "creada_por_id" INTEGER NOT NULL,
ADD COLUMN     "porcentaje_de_adelanto" SMALLINT NOT NULL,
ADD COLUMN     "precio" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "regla_de_cancelacion_id" INTEGER NOT NULL,
ADD COLUMN     "vence_en" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "adicional_pedido" (
    "reserva_id" INTEGER NOT NULL,
    "adicional_id" INTEGER NOT NULL,

    CONSTRAINT "adicional_pedido_pkey" PRIMARY KEY ("reserva_id","adicional_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reserva_codigo_key" ON "reserva"("codigo");

-- CreateIndex
CREATE INDEX "reserva_titular_id_estado_idx" ON "reserva"("titular_id", "estado");

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_creada_por_id_fkey" FOREIGN KEY ("creada_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_regla_de_cancelacion_id_fkey" FOREIGN KEY ("regla_de_cancelacion_id") REFERENCES "regla_de_cancelacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adicional_pedido" ADD CONSTRAINT "adicional_pedido_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adicional_pedido" ADD CONSTRAINT "adicional_pedido_adicional_id_fkey" FOREIGN KEY ("adicional_id") REFERENCES "adicional"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Montos en soles mayores que cero; el adelanto no supera el precio.
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_montos_check"
  CHECK ("precio" > 0 AND "adelanto" > 0 AND "adelanto" <= "precio");

ALTER TABLE "reserva" ADD CONSTRAINT "reserva_porcentaje_de_adelanto_check"
  CHECK ("porcentaje_de_adelanto" BETWEEN 1 AND 100);

-- Seis caracteres sin los que se confunden al leerlos (0, O, 1, I).
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_codigo_check"
  CHECK ("codigo" ~ '^[A-HJ-NP-Z2-9]{6}$');

-- Una reserva que espera pago siempre sabe cuándo deja de retener el turno.
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_vence_en_check"
  CHECK ("estado" <> 'pendiente_de_pago' OR "vence_en" IS NOT NULL);
