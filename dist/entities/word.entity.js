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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Word = void 0;
const typeorm_1 = require("typeorm");
const book_entity_1 = require("./book.entity");
let Word = class Word {
};
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Word.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => book_entity_1.Book, { primary: true }),
    (0, typeorm_1.JoinColumn)([
        {
            name: "bookId",
        },
        {
            name: "bookName",
        }
    ]),
    __metadata("design:type", book_entity_1.Book)
], Word.prototype, "bookId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Word.prototype, "modifiedTime", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Word.prototype, "phonetic", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Word.prototype, "trans", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 64, unique: true }),
    __metadata("design:type", String)
], Word.prototype, "word", void 0);
Word = __decorate([
    (0, typeorm_1.Entity)()
], Word);
exports.Word = Word;
