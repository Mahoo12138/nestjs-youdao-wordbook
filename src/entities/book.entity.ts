import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Word } from './word.entity';

@Entity()
export class Book {
  @PrimaryColumn()
  bookId: string

  @Column()
  bookName: string

  @Column()
  isDefault: boolean

  @OneToMany(() => Word, word => word.bookId)
  words: Word[];
}