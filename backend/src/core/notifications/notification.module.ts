// import { Module } from '@nestjs/common';
// import { MailerModule } from '@nestjs-modules/mailer';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { NotificationService } from './notification.service';
// import { ConfigService } from '@nestjs/config';

// @Module({
//   imports: [
//     MailerModule.forRootAsync({
//       useFactory: async (configService: ConfigService) => ({
//         transport: {
//           host: configService.get<string>('SMTP_HOST'),
//           port: configService.get<number>('SMTP_PORT'),
//           secure: false,
//           auth: {
//             user: configService.get<string>('SMTP_USER'),
//             pass: configService.get<string>('SMTP_PASSWORD'),
//           },
//         },
//         defaults: {
//           from: `"${configService.get<string>('APP_NAME')}" <${configService.get<string>('SMTP_FROM')}>`,
//         },
//         template: {
//           dir: __dirname + '/templates',
//           adapter: new HandlebarsAdapter(),
//           options: {
//             strict: true,
//           },
//         },
//       }),
//       inject: [ConfigService],
//     }),
//   ],
//   providers: [NotificationService],
//   exports: [NotificationService],
// })
// export class NotificationModule {}
