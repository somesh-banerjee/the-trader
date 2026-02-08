import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SocketService } from './components/socket/socket.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Live Data Consumer')
    .setDescription('The live data consumer service for Trader')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  await app.listen(port ?? 3000);

  // const socketServiceInstance = app.get(SocketService);
  // await socketServiceInstance.start();
}
bootstrap();
