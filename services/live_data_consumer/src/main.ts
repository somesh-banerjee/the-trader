import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SocketService } from './socket/socket.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  const socketServiceInstance = app.get(SocketService);
  await socketServiceInstance.start();
}
bootstrap();
