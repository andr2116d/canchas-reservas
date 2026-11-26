-- CreateEnum
CREATE TYPE "accion_auditada" AS ENUM ('alta', 'edicion', 'desactivacion', 'reactivacion', 'restablecimiento_de_contrasena');

-- CreateTable
CREATE TABLE "registro_auditoria" (
    "id" SERIAL NOT NULL,
    "accion" "accion_auditada" NOT NULL,
    "usuario_afectado_id" INTEGER NOT NULL,
    "ejecutado_por_id" INTEGER NOT NULL,
    "ocurrido_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registro_auditoria_usuario_afectado_id_ocurrido_en_idx" ON "registro_auditoria"("usuario_afectado_id", "ocurrido_en");

-- AddForeignKey
ALTER TABLE "registro_auditoria" ADD CONSTRAINT "registro_auditoria_usuario_afectado_id_fkey" FOREIGN KEY ("usuario_afectado_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_auditoria" ADD CONSTRAINT "registro_auditoria_ejecutado_por_id_fkey" FOREIGN KEY ("ejecutado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

