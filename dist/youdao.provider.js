"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createYoudaoProviders = void 0;
const axios_1 = require("axios");
const youdao_constant_1 = require("./youdao.constant");
function createYoudaoProviders(options) {
    return [
        {
            provide: youdao_constant_1.YOUDAO_OPTIONS,
            useValue: options,
        },
        {
            provide: youdao_constant_1.YOUDAO_AXIOS_INSTANCE,
            useValue: axios_1.default.create({
                baseURL: youdao_constant_1.YOUDAO_BASE_URL
            })
        },
    ];
}
exports.createYoudaoProviders = createYoudaoProviders;
// export const YoudaoProvider = {
//   provide: ThrottlerStorage,
//   useFactory: (options: ThrottlerModuleOptions) => {
//     return options.storage ? options.storage : new YoudaoService();
//   },
//   inject: [THROTTLER_OPTIONS],
// };
