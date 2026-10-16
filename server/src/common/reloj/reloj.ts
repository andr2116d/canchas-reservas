import { Injectable } from '@nestjs/common';

@Injectable()
export class Reloj {
  ahora() {
    return new Date();
  }
}
