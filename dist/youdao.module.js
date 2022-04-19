"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var YoudaoModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoudaoModule = void 0;
const common_1 = require("@nestjs/common");
const youdao_provider_1 = require("./youdao.provider");
const youdao_service_1 = require("./youdao.service");
let YoudaoModule = YoudaoModule_1 = class YoudaoModule {
    /**
     * Register the module synchronously.
     */
    static forRoot(options) {
        const providers = [...(0, youdao_provider_1.createYoudaoProviders)(options), youdao_service_1.YoudaoService];
        return {
            module: YoudaoModule_1,
            providers,
            imports: [common_1.CacheModule.register(options.cacheOption)],
            exports: providers,
        };
    }
};
YoudaoModule = YoudaoModule_1 = __decorate([
    (0, common_1.Module)({})
], YoudaoModule);
exports.YoudaoModule = YoudaoModule;
