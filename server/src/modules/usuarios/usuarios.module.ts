import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { RecepcionistasController } from './recepcionistas.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [AuditoriaModule],
  controllers: [RecepcionistasController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
