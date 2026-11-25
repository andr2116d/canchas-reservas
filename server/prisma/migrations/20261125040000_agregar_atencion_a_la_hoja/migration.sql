-- CreateEnum
CREATE TYPE "motivo_de_reclamo" AS ENUM ('reserva_y_pago', 'cancelacion_y_devolucion', 'estado_de_la_cancha', 'atencion_del_personal', 'material_adicional', 'web_y_cuenta', 'otro');

-- CreateEnum
CREATE TYPE "accion_sobre_hoja" AS ENUM ('apertura', 'clasificacion', 'cambio_de_tipo', 'respuesta');

-- AlterTable
ALTER TABLE "hoja_de_reclamacion" ADD COLUMN     "abierta_en" TIMESTAMPTZ(3),
ADD COLUMN     "carta_enviada_el" DATE,
ADD COLUMN     "motivo" "motivo_de_reclamo",
ADD COLUMN     "respondida_en" TIMESTAMPTZ(3),
ADD COLUMN     "respondida_por_id" INTEGER,
ADD COLUMN     "respuesta_cifrada" TEXT;

-- CreateTable
CREATE TABLE "cambio_de_hoja" (
    "id" SERIAL NOT NULL,
    "hoja_id" INTEGER NOT NULL,
    "accion" "accion_sobre_hoja" NOT NULL,
    "detalle" JSONB,
    "ejecutado_por_id" INTEGER NOT NULL,
    "ocurrido_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambio_de_hoja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cambio_de_hoja_hoja_id_ocurrido_en_idx" ON "cambio_de_hoja"("hoja_id", "ocurrido_en");

-- CreateIndex
CREATE INDEX "cambio_de_hoja_ocurrido_en_idx" ON "cambio_de_hoja"("ocurrido_en");

-- AddForeignKey
ALTER TABLE "hoja_de_reclamacion" ADD CONSTRAINT "hoja_de_reclamacion_respondida_por_id_fkey" FOREIGN KEY ("respondida_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambio_de_hoja" ADD CONSTRAINT "cambio_de_hoja_hoja_id_fkey" FOREIGN KEY ("hoja_id") REFERENCES "hoja_de_reclamacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambio_de_hoja" ADD CONSTRAINT "cambio_de_hoja_ejecutado_por_id_fkey" FOREIGN KEY ("ejecutado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Una hoja respondida siempre tiene su respuesta, cuándo y quién (DS 011-2011-PCM, art. 5).
ALTER TABLE "hoja_de_reclamacion" ADD CONSTRAINT "hoja_de_reclamacion_respuesta_check" CHECK (
  ("estado" = 'respondida') = (
    "respuesta_cifrada" IS NOT NULL AND "respondida_en" IS NOT NULL AND "respondida_por_id" IS NOT NULL
  )
);

-- Por carta, la respuesta lleva la fecha de envío.
ALTER TABLE "hoja_de_reclamacion" ADD CONSTRAINT "hoja_de_reclamacion_carta_check" CHECK (
  "estado" <> 'respondida' OR "medio_de_respuesta" <> 'carta' OR "carta_enviada_el" IS NOT NULL
);
