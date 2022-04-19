import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Book } from './book.entity'
@Entity()
export class Word {
  @PrimaryColumn()
  itemId: string

  @ManyToOne(() => Book, { primary: true })
  @JoinColumn([
    {
      name: "bookId",
    },
    {
      name: "bookName",
    }
  ])
  bookId: Book;


  @Column()
  modifiedTime: Date

  @Column()
  phonetic: string

  @Column()
  trans: string

  @Column({ type: "varchar", length: 64, unique: true })
  word: string
}