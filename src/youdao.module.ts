import { Module, CacheModule, DynamicModule } from '@nestjs/common';
import { YoudaoModuleOptions } from './types';
import { createYoudaoProviders } from './youdao.provider';
import { YoudaoService } from './youdao.service';

@Module({})
export class YoudaoModule {
  /**
   * Register the module synchronously.
   */
  static forRoot(options: YoudaoModuleOptions): DynamicModule {
    const providers = [...createYoudaoProviders(options), YoudaoService];
    return {
      module: YoudaoModule,
      providers,
      imports: [CacheModule.register(options.cacheOption)],
      exports: providers,
    };
  }
}