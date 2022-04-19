import { CacheModuleOptions } from '@nestjs/common';
import { Word } from './entities/word.entity';

export interface YoudaoModuleOptions {
  email: string;
  password: string;
  connectionName?: string;
  cacheOption?: CacheModuleOptions
}

export interface WordResp {
  itemList: Word[],
  total: number
}

export interface UserInfo {
  nickname: string,
  userid: string
}