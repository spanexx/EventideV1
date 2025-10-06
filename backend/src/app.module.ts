import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configValidationSchema } from './core/config.schema';
import { SecurityModule } from './core/security/security.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { SessionModule } from './core/sessions/session.module';
import { CustomCacheModule } from './core/cache/cache.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { MetricsModule } from './core/metrics/metrics.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { WebsocketsModule } from './core/websockets';
import { BrowserLogsModule } from './modules/browser-logs/browser-logs.module';
import { LogManagerService } from './core/log-manager/log-manager.service';
import { BackendLogsModule } from './modules/backend-logs/backend-logs.module';
import { BookingModule } from './modules/booking/booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env'],
      validationSchema: configValidationSchema,
      isGlobal: true, // make config globally available
      cache: true, // cache environment variables
      expandVariables: true, // enable variable expansion
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        connectionFactory: (connection) => {
          // Optimize connection for memory usage
          connection.on('connected', () => {
            console.log('MongoDB connected successfully');
          });
          connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        throttlers: [
          {
            // Time-to-live: 60 seconds by default
            // After this time, consumed tokens are replenished
            ttl: configService.get<number>('THROTTLE_TTL', 60),
            // Limit: 10 requests per TTL period per IP address
            // After 10 requests, subsequent requests will be blocked until TTL expires
            limit: configService.get<number>('THROTTLE_LIMIT', 10),
          },
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    SecurityModule,
    SessionModule,
    CustomCacheModule,
    MetricsModule,
    WebsocketsModule,

    // FeatureFlagsModule,
    // I18nConfigModule.forRoot(),
    // DeprecationModule,
    UsersModule,
    // DashboardModule,
    // AiModule,
    // ProvidersModule,
    // PaymentsModule,
    AvailabilityModule,
    // ClientsModule,
    // ServicesModule,
    // FrontendLogsModule,
    AuthModule,
    BookingModule,
    BrowserLogsModule,
    BackendLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService, LogManagerService],
})
export class AppModule {}
