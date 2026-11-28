-- DropForeignKey
ALTER TABLE "adicional_pedido" DROP CONSTRAINT "adicional_pedido_adicional_id_fkey";

-- AddForeignKey
ALTER TABLE "adicional_pedido" ADD CONSTRAINT "adicional_pedido_adicional_id_fkey" FOREIGN KEY ("adicional_id") REFERENCES "adicional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

