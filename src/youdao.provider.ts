import { Provider } from '@nestjs/common';
import axios  from 'axios'
import { YoudaoModuleOptions } from './types';
import { YOUDAO_AXIOS_INSTANCE, YOUDAO_BASE_URL, YOUDAO_OPTIONS } from './youdao.constant';

export function createYoudaoProviders(options: YoudaoModuleOptions): Provider[] {
  return [
    {
      provide: YOUDAO_OPTIONS,
      useValue: options,
    },
    {
      provide: YOUDAO_AXIOS_INSTANCE,
      useValue: axios.create({
        baseURL: YOUDAO_BASE_URL
      })
    },
  ];
}

// export const YoudaoProvider = {
//   provide: ThrottlerStorage,
//   useFactory: (options: ThrottlerModuleOptions) => {
//     return options.storage ? options.storage : new YoudaoService();
//   },
//   inject: [THROTTLER_OPTIONS],
// };
