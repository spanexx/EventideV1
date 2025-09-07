import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Module({})
export class I18nConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: I18nConfigModule,
      imports: [
        I18nModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const isDevelopment =
              configService.get('NODE_ENV') === 'development';
            const i18nPath = path.resolve(process.cwd(), 'src', 'i18n');

            console.log(
              `[I18N] Environment: ${isDevelopment ? 'development' : 'production'}`,
            );
            console.log(`[I18N] Using path: ${i18nPath}`);

            return {
              fallbackLanguage: configService.get('I18N_FALLBACK_LANG', 'en'),
              loaderOptions: {
                path: i18nPath,
                watch: isDevelopment,
              },
              resolvers: [
                { use: QueryResolver, options: ['lang', 'locale'] },
                new HeaderResolver(['x-lang', 'accept-language']),
                AcceptLanguageResolver,
              ],
            };
          },
        }),
      ],
    };
  }
}
