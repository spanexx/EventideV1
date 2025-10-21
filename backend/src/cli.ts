// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// // import { AvailabilityCommand } from './modules/availability/commands/availability.command';

// async function bootstrap() {
//   const app = await NestFactory.createApplicationContext(AppModule);
  
//   // Get the command service
//   const command = app.get(AvailabilityCommand);
  
//   try {
//     // Run the migration
//     await command.migrate();
//     console.log('Migration completed successfully');
//   } catch (error) {
//     console.error('Migration failed:', error);
//   } finally {
//     await app.close();
//   }
// }

// bootstrap();
