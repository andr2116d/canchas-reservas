-- AlterTable
ALTER TABLE "reserva" ADD COLUMN     "expirada_en" TIMESTAMPTZ(3);


-- Las que ya expiraron antes de este cambio vencieron cuando terminó su plazo.
UPDATE "reserva" SET "expirada_en" = "vence_en" WHERE "estado" = 'expirada';
