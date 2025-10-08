import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { UsersSeeder } from './users.seeder';
import { AvailabilitySeeder } from './availability.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  const usersSeeder = app.get(UsersSeeder);
  const availabilitySeeder = app.get(AvailabilitySeeder);

  const command = process.argv[2];

  try {
    switch (command) {
      case 'seed':
        console.log('🌱 Starting database seeding...\n');
        await usersSeeder.seed();
        await availabilitySeeder.seed();
        console.log('\n✅ Database seeding completed successfully!');
        break;

      case 'clear':
        console.log('🗑️  Starting database clearing...\n');
        await availabilitySeeder.clear();
        await usersSeeder.clear();
        console.log('\n✅ Database cleared successfully!');
        break;

      case 'refresh':
        console.log('🔄 Refreshing database...\n');
        await availabilitySeeder.clear();
        await usersSeeder.clear();
        console.log('');
        await usersSeeder.seed();
        await availabilitySeeder.seed();
        console.log('\n✅ Database refreshed successfully!');
        break;

      default:
        console.log('❌ Unknown command. Use: seed, clear, or refresh');
        break;
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
