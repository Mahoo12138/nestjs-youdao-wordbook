import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { getConnection, getRepository } from "typeorm";
import { ConnectionMetadataBuilder } from "typeorm/connection/ConnectionMetadataBuilder";
import { EntityMetadataValidator } from "typeorm/metadata-builder/EntityMetadataValidator";
import { Cache } from 'cache-manager'
import * as crypto from 'crypto';
import { Axios,AxiosRequestConfig } from 'axios'

import { UserInfo, WordResp, YoudaoModuleOptions } from './types';
import { Word } from './entities/word.entity'
import { YOUDAO_ADD_WORDS_URL, YOUDAO_AXIOS_INSTANCE, YOUDAO_BOOKS_URL, YOUDAO_COOKIE, YOUDAO_DEL_WORDS_URL, YOUDAO_LOGIN_URL, YOUDAO_OPTIONS, YOUDAO_USER_INFO_URL, YOUDAO_WORDS_URL } from './youdao.constant';
import { Book } from './entities/book.entity';


@Injectable()
export class YoudaoService implements OnModuleInit, OnApplicationBootstrap {
  private logger = new Logger(YoudaoService.name)

  constructor(
    @Inject(YOUDAO_OPTIONS) private config: YoudaoModuleOptions,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(YOUDAO_AXIOS_INSTANCE) private _req: Axios
  ) { }
  async onApplicationBootstrap() {
    await this.login()
  }

  private async initAxios() {
    const service = this;
    const handleCookie = async (config: AxiosRequestConfig) => {
      if (!config.url.includes("login")) {
        let cookie = await service.youdaoCookie
        if(!cookie){
          console.log("cookie", cookie)
          cookie = await service.login()
        }
        config.headers = {
          Cookie: cookie
        }
      }
      return config
    }
    this._req.interceptors.response.use((resp) => {
      if (resp.data.msg) {
        if (resp.data.code === 0) {
          return resp.data.data
        }
        return Promise.reject("Request Error");
      }
      return resp
    },(err)=>{
      console.log("Request fail", err)
    })
    this._req.interceptors.request.use(handleCookie)
  }

  async onModuleInit() {
    const connection = getConnection(this.config?.connectionName);
    if (connection.hasMetadata(Word)) {
      return;
    }
    // 拿到连接的元数据生成器
    const connectionMetadataBuilder = new ConnectionMetadataBuilder(connection);
    // 创建一个 Entity 元数据的验证器
    const entityMetadataValidator = new EntityMetadataValidator();
    // 生成元数据
    const wordMetadatas = await connectionMetadataBuilder.buildEntityMetadatas([Book, Word]);

    entityMetadataValidator.validateMany(wordMetadatas.filter(metadata => metadata.tableType !== "view"), connection.driver);

    connection.entityMetadatas.push(...wordMetadatas);

    await connection.synchronize();

    this.initAxios()
  }

  private async login() {
    const md5 = crypto.createHash('md5');
    const res = await this._req.get(
      YOUDAO_LOGIN_URL +
      `username=${this.config.email}&password=${md5
        .update(this.config.password)
        .digest('hex')}&um=true`,
    )
    const cookie = res.headers['set-cookie'].map(ck => ck.split(';')[0]).reduce((pre, cur) => pre + ';' + cur)
    await this.cacheManager.set(YOUDAO_COOKIE, cookie, { ttl: 3600 * 24 * 30 });
    return cookie
  }

  private get youdaoCookie() {
    return this.cacheManager.get<string>(YOUDAO_COOKIE)
  }

  async syncAllWords() {
    const books: Book[] = await this.getBooks()
    // console.log(books)
    const bookRepo = getRepository(Book, this.config.connectionName);
    books && bookRepo.save(books)

    let offset = 0;
    const wordRepo = getRepository(Word, this.config.connectionName);
    const words: WordResp = await this._req.get(YOUDAO_WORDS_URL + `?limit=30&offset=${offset}`)
    while (1) {
      if (words && words.itemList.length != 0) {
        wordRepo.save(words.itemList.map(word => {
          word.modifiedTime = new Date(word.modifiedTime)
          return word
        }))
        offset += 30;
      } else {
        break;
      }
    }
    this.logger.log(`Synchronous success, ${words.itemList.length ?? 0} word(s) were synchronized.`);
  }

  async getBooks(): Promise<Book[]> {
    return await this._req.get(YOUDAO_BOOKS_URL)
  }

  async getWords(limit?:number,offset = 0):Promise<WordResp>{
    const cookie = this.youdaoCookie;
   return  await this._req.get(YOUDAO_WORDS_URL + `?limit=${limit}&offset=${offset}`)
  }

  async getUserInfo(): Promise<UserInfo> {
    return await this._req.get(YOUDAO_USER_INFO_URL)
  }

  async getWordsFromBook(bookId: string):Promise<WordResp | void> {
    if(this.checkBookExist(bookId)){ return }
    this._req.get(`${YOUDAO_WORDS_URL}?bookId=${bookId}}`)
  }

  async addOneWord(word: string, bookId?: string) {
    if (!bookId) {
      const books = await this.getBooks()
      books.forEach(book => {
        if (book.isDefault) bookId = book.bookId
      })
    }
    await this._req.get(`${YOUDAO_ADD_WORDS_URL}?word=${word}&bookId=${bookId}`)
  }

  async delOneWord(itemId: string) {
    await this._req.get(`${YOUDAO_DEL_WORDS_URL}?itemId=${itemId}`)
  }

  async modOneWord(itemId: string, bookId: string) {
    if (this.checkBookExist(bookId)) { return }
    await this._req.get(`${YOUDAO_DEL_WORDS_URL}?itemId=${itemId}`)
  }

  async checkBookExist(bookId: string) {
    const allBooks = await this.getBooks()
    const book = allBooks.filter(book => bookId = book.bookId)
    if (book.length) {
      this.logger.error(`The target bookID ${bookId} is not found.`)
      return false
    }
    return true
  }
}
