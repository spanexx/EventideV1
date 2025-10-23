import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';
import { BackendLogsService } from './modules/backend-logs/backend-logs.service';

async function bootstrap() {
  try {
    // Create the application instance
    console.log('Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      // logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      abortOnError: false, // Prevent immediate shutdown on initialization errors
      rawBody: true, // Enable raw body for webhook signature verification
    });

    // Use our custom logger
    app.useLogger(app.get(BackendLogsService));


    // Add memory monitoring function
    function logMemoryUsage() {
      const used = process.memoryUsage();
      console.log('Memory Usage:');
      for (const key in used) {
        console.log(
          `${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`,
        );
      }
    }

    // Periodically clean up old security events (every hour)
    setInterval(() => {
      // This will be handled by the security service's cleanupOldEvents method
      console.log('Performing periodic cleanup tasks...');
    }, 3600000); // Every hour

    // Log memory usage periodically (every 30 seconds)
    setInterval(() => {
      logMemoryUsage();
    }, 30000); // Log every 30 seconds

    // Initialize core functionality
    console.log('Initializing core functionality...');
    app.use(helmet());
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    }));
    app.enableCors({
      origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : true,
      credentials: true,
    });
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter(app.getHttpAdapter()));
    // Set global prefix for all routes
    app.setGlobalPrefix('api');

    // Initialize Swagger
    console.log('Setting up Swagger documentation...');
    const config = new DocumentBuilder()
      .setTitle('Eventide API')
      .setDescription('The Eventide API description')
      .setVersion('1.0')
      .addTag('System', 'System-related endpoints including health check')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('availability', 'Availability management endpoints')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // Get port from environment variable
    const port = parseInt(process.env.PORT ?? '3000', 10);
    const host = '0.0.0.0'; // Important: Listen on all interfaces

    console.log('Initializing application modules...');
    try {
      await app.init();
      console.log('Application modules initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application modules:', error);
      throw error;
    }

    // Start listening
    console.log(`Starting server on ${host}:${port}`);
    await app.listen(port, host);

    console.log(`Application is running at http://${host}:${port}`);
    console.log('Health check endpoint:', `http://${host}:${port}/health`);
    console.log('Swagger documentation:', `http://${host}:${port}/api`);

    // Handle shutdown gracefully
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach((signal) => {
      process.on(signal, () => {
        console.log(`Received ${signal}, shutting down gracefully...`);
        void app.close().then(
          () => {
            console.log('Application shutdown complete.');
            process.exit(0);
          },
          (err) => {
            console.error('Error during shutdown:', err);
            process.exit(1);
          },
        );
      });
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
