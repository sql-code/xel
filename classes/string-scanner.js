
// @copyright
//   © 2016-2021 Jarosław Foksa
// @license
//   GNU General Public License v3, Xel Commercial License v1 (check LICENSE.md for details)

export default class StringScanner {
  // @type (string) => void
  constructor(text) {
    this.text = text;

    this.cursor = 0;
    this.line = 1;
    this.column = 1;

    this._storedPosition = {cursor: 0, line: 1, column: 1};
  }

  // @type (number) => string?
  //
  // Read given number of chars.
  read(i = 1) {
    let string = "";
    let initialCursor = this.cursor;

    for (let j = 0; j < i; j += 1) {
      let c = this.text[initialCursor + j];

      if (c === undefined) {
        break;
      }
      else {
        string += c;
        this.cursor += 1;

        if (c === "\n"){
          this.line += 1;
          this.column = 1;
        }
        else {
          this.column += 1;
        }
      }
    }

    return (string === "" ? null : string);
  }

  // @type (number) => string?
  //
  // Read given number of chars without advancing the cursor.
  peek(i = 1) {
    let string = "";

    for (let j = 0; j < i; j += 1) {
      let c = this.text[this.cursor + j];

      if (c === undefined) {
        break;
      }
      else {
        string += c;
      }
    }

    return (string === "" ? null : string);
  }

  // @type () => string
  //
  // Continue reading the chars as long as they are spaces.
  eatSpaces() {
    let spaces = "";

    while (this.peek() === " ") {
      spaces += this.read();
    }

    return spaces;
  }

  // @type () => string
  //
  // Continue reading the chars as long as they are spaces or new line chars.
  eatWhitespace() {
    let whitespace = "";

    while (this.peek() === " " || this.peek() === "\n") {
      whitespace += this.read();
    }

    return whitespace;
  }

  // @type () => void
  storePosition() {
    let {cursor, line, column} = this;
    this._storedPosition = {cursor, line, column};
  }

  // @type () => void
  restorePosition() {
    let {cursor, line, column} = this._storedPosition;

    this.cursor = cursor;
    this.line = line;
    this.column = column;
  }
}
