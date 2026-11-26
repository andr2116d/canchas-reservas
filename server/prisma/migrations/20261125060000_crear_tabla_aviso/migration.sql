-- CreateEnum
CREATE TYPE "tipo_de_aviso" AS ENUM ('nuevo_reclamo', 'reclamo_respondido');

-- CreateTable
CREATE TABLE "aviso" (
    "id" SERIAL NOT NULL,
    "destinatario_id" INTEGER NOT NULL,
    "tipo" "tipo_de_aviso" NOT NULL,
    "referencia" TEXT NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leido_en" TIMESTAMPTZ(3),

    CONSTRAINT "aviso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aviso_destinatario_id_creado_en_idx" ON "aviso"("destinatario_id", "creado_en");

-- AddForeignKey
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Cada aviso nuevo se anuncia en el canal «avisos» con el id de su destinatario, para que el
-- server lo reenvíe en tiempo real solo a esa persona. El aviso no lleva más datos.
CREATE FUNCTION anunciar_aviso() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('avisos', NEW.destinatario_id::text);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER aviso_se_anuncia
  AFTER INSERT ON "aviso"
  FOR EACH ROW EXECUTE FUNCTION anunciar_aviso();
