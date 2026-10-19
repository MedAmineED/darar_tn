import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });
  const config = app.get(AppConfigService);

  // Cross-origin images need CORP relaxed; keep other Helmet protections.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());

  // Serve uploaded product images statically.
  app.useStaticAssets(join(process.cwd(), config.uploads.dir), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix(config.apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Darya Admin API')
    .setDescription('Administration API for the Darya business platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(config.refreshCookie.name)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${config.apiPrefix}/docs`, app, document);

  await app.listen(config.port);
  // eslint-disable-next-line no-console
  console.log(
    `Darya Admin API running on http://localhost:${config.port}/${config.apiPrefix}`,
  );
}

void bootstrap();
