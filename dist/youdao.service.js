"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var YoudaoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoudaoService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const ConnectionMetadataBuilder_1 = require("typeorm/connection/ConnectionMetadataBuilder");
const EntityMetadataValidator_1 = require("typeorm/metadata-builder/EntityMetadataValidator");
const crypto = require("crypto");
const axios_1 = require("axios");
const word_entity_1 = require("./entities/word.entity");
const youdao_constant_1 = require("./youdao.constant");
const book_entity_1 = require("./entities/book.entity");
let YoudaoService = YoudaoService_1 = class YoudaoService {
    constructor(config, cacheManager, _req) {
        this.config = config;
        this.cacheManager = cacheManager;
        this._req = _req;
        this.logger = new common_1.Logger(YoudaoService_1.name);
    }
    async onApplicationBootstrap() {
        await this.login();
    }
    async initAxios() {
        const service = this;
        const handleCookie = async (config) => {
            if (!config.url.includes("login")) {
                let cookie = await service.youdaoCookie;
                if (!cookie) {
                    console.log("cookie", cookie);
                    cookie = await service.login();
                }
                config.headers = {
                    Cookie: cookie
                };
            }
            return config;
        };
        this._req.interceptors.response.use((resp) => {
            if (resp.data.msg) {
                if (resp.data.code === 0) {
                    return resp.data.data;
                }
                return Promise.reject("Request Error");
            }
            return resp;
        }, (err) => {
            console.log("Request fail", err);
        });
        this._req.interceptors.request.use(handleCookie);
    }
    async onModuleInit() {
        var _a;
        const connection = (0, typeorm_1.getConnection)((_a = this.config) === null || _a === void 0 ? void 0 : _a.connectionName);
        if (connection.hasMetadata(word_entity_1.Word)) {
            return;
        }
        // 拿到连接的元数据生成器
        const connectionMetadataBuilder = new ConnectionMetadataBuilder_1.ConnectionMetadataBuilder(connection);
        // 创建一个 Entity 元数据的验证器
        const entityMetadataValidator = new EntityMetadataValidator_1.EntityMetadataValidator();
        // 生成元数据
        const wordMetadatas = await connectionMetadataBuilder.buildEntityMetadatas([book_entity_1.Book, word_entity_1.Word]);
        entityMetadataValidator.validateMany(wordMetadatas.filter(metadata => metadata.tableType !== "view"), connection.driver);
        connection.entityMetadatas.push(...wordMetadatas);
        await connection.synchronize();
        this.initAxios();
    }
    async login() {
        const md5 = crypto.createHash('md5');
        const res = await this._req.get(youdao_constant_1.YOUDAO_LOGIN_URL +
            `username=${this.config.email}&password=${md5
                .update(this.config.password)
                .digest('hex')}&um=true`);
        const cookie = res.headers['set-cookie'].map(ck => ck.split(';')[0]).reduce((pre, cur) => pre + ';' + cur);
        await this.cacheManager.set(youdao_constant_1.YOUDAO_COOKIE, cookie, { ttl: 3600 * 24 * 30 });
        return cookie;
    }
    get youdaoCookie() {
        return this.cacheManager.get(youdao_constant_1.YOUDAO_COOKIE);
    }
    async syncAllWords() {
        var _a;
        const books = await this.getBooks();
        // console.log(books)
        const bookRepo = (0, typeorm_1.getRepository)(book_entity_1.Book, this.config.connectionName);
        books && bookRepo.save(books);
        let offset = 0;
        const wordRepo = (0, typeorm_1.getRepository)(word_entity_1.Word, this.config.connectionName);
        const words = await this._req.get(youdao_constant_1.YOUDAO_WORDS_URL + `?limit=30&offset=${offset}`);
        while (1) {
            if (words && words.itemList.length != 0) {
                wordRepo.save(words.itemList.map(word => {
                    word.modifiedTime = new Date(word.modifiedTime);
                    return word;
                }));
                offset += 30;
            }
            else {
                break;
            }
        }
        this.logger.log(`Synchronous success, ${(_a = words.itemList.length) !== null && _a !== void 0 ? _a : 0} word(s) were synchronized.`);
    }
    async getBooks() {
        return await this._req.get(youdao_constant_1.YOUDAO_BOOKS_URL);
    }
    async getWords(limit, offset = 0) {
        const cookie = this.youdaoCookie;
        return await this._req.get(youdao_constant_1.YOUDAO_WORDS_URL + `?limit=${limit}&offset=${offset}`);
    }
    async getUserInfo() {
        return await this._req.get(youdao_constant_1.YOUDAO_USER_INFO_URL);
    }
    async getWordsFromBook(bookId) {
        if (this.checkBookExist(bookId)) {
            return;
        }
        this._req.get(`${youdao_constant_1.YOUDAO_WORDS_URL}?bookId=${bookId}}`);
    }
    async addOneWord(word, bookId) {
        if (!bookId) {
            const books = await this.getBooks();
            books.forEach(book => {
                if (book.isDefault)
                    bookId = book.bookId;
            });
        }
        await this._req.get(`${youdao_constant_1.YOUDAO_ADD_WORDS_URL}?word=${word}&bookId=${bookId}`);
    }
    async delOneWord(itemId) {
        await this._req.get(`${youdao_constant_1.YOUDAO_DEL_WORDS_URL}?itemId=${itemId}`);
    }
    async modOneWord(itemId, bookId) {
        if (this.checkBookExist(bookId)) {
            return;
        }
        await this._req.get(`${youdao_constant_1.YOUDAO_DEL_WORDS_URL}?itemId=${itemId}`);
    }
    async checkBookExist(bookId) {
        const allBooks = await this.getBooks();
        const book = allBooks.filter(book => bookId = book.bookId);
        if (book.length) {
            this.logger.error(`The target bookID ${bookId} is not found.`);
            return false;
        }
        return true;
    }
};
YoudaoService = YoudaoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(youdao_constant_1.YOUDAO_OPTIONS)),
    __param(1, (0, common_1.Inject)(common_1.CACHE_MANAGER)),
    __param(2, (0, common_1.Inject)(youdao_constant_1.YOUDAO_AXIOS_INSTANCE)),
    __metadata("design:paramtypes", [Object, Object, axios_1.Axios])
], YoudaoService);
exports.YoudaoService = YoudaoService;
