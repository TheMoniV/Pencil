/*
* The very first implementation of Pencil interpreter.
* All rights reserved to Hammadi Agharass - Alten 2018
* @File: Lexer.ts
* @Description: This file contains all the needed implementation of Pencile lexer.
*/

/// <reference path="./AST/Expression.ts" />
/// <reference path="./AST/Statement.ts" />

class Lexer {
    private stringToParse: string;
    private currentLoc: number;
    private currentCommentNest: number;
    private errorList: string[];
    private keywords: string;
    private tokens: IToken[];
    private getLoc: (loc: number) => number[];

    public constructor(getLoc: (loc: number) => number[]) {
        this.stringToParse = "";
        this.currentLoc = 0;
        this.currentCommentNest = 0;
        this.errorList = [];
        this.keywords = " console let const fun return if else while for break continue true false null typeof or and ";
        this.tokens = [];
        this.getLoc = getLoc;
    }

    public parse(str: string): ILexerResult {
        this.__INIT__(str);
        while (!this.isTheEnd()) {
            const startToken: number = this.currentLoc;
            let type: string | undefined;
            let token: string | boolean | number | undefined;
            switch (this.stringToParse[this.currentLoc]) {
                case "\u0020":
                case "\u00a0":
                case "\u205f":
                case "\u3000":
                case "\u1680":
                case "\u180e":
                case "\u200a":
                case "\u202f":
                case "\u2000":
                case "\r":
                case "\t":
                case "\u000a":
                    // Ignore whitespace.
                    this.currentLoc++;
                    continue;
                case "(":
                    type = "LEFT_PAREN";
                    this.currentLoc++;
                    break;
                case ")":
                    type = "RIGHT_PAREN";
                    this.currentLoc++;
                    break;
                case "{":
                    type = "LEFT_BRACE";
                    this.currentLoc++;
                    break;
                case "}":
                    if (this.stringToParse[this.currentLoc + 1] === ">") {
                        type = "OBJECT-CLOSING";
                        this.currentLoc += 2;
                        break;
                    }
                    type = "RIGHT_BRACE";
                    this.currentLoc++;
                    break;
                case "[":
                    type = "LEFT_BRACKET";
                    this.currentLoc++;
                    break;
                case "]":
                    type = "RIGHT_BRACKET";
                    this.currentLoc++;
                    break;
                case ",":
                    type = "COMMA";
                    this.currentLoc++;
                    break;
                case ".":
                    type = "DOT";
                    this.currentLoc++;
                    break;
                case "-":
                    if (this.stringToParse[this.currentLoc + 1] === "=") {
                        type = "MINUS_EQUAL";
                        this.currentLoc += 2;
                        break;
                    }
                    if (this.stringToParse[this.currentLoc + 1] === "-") {
                        type = "MINUS_MINUS";
                        this.currentLoc += 2;
                        break;
                    }
                    type = "MINUS";
                    this.currentLoc++;
                    break;
                case "+":
                    if (this.stringToParse[this.currentLoc + 1] === "=") {
                        type = "PLUS_EQUAL";
                        this.currentLoc += 2;
                        break;
                    }
                    if (this.stringToParse[this.currentLoc + 1] === "+") {
                        type = "PLUS_PLUS";
                        this.currentLoc += 2;
                        break;
                    }
                    type = "PLUS";
                    this.currentLoc++;
                    break;
                case ";":
                    type = "SEMICOLON";
                    this.currentLoc++;
                    break;
                case "*":
                    if (this.stringToParse[this.currentLoc + 1] === "=") {
                        type = "STAR_EQUAL";
                        this.currentLoc += 2;
                        break;
                    }
                    if (this.stringToParse[this.currentLoc + 1] === "*") {
                        if (this.stringToParse[this.currentLoc + 2] === "=") {
                            type = "STAR_STAR_EQUAL";
                            this.currentLoc += 3;
                            break;
                        }
                        type = "STAR_STAR";
                        this.currentLoc += 2;
                        break;
                    }
                    type = "STAR";
                    this.currentLoc++;
                    break;
                case "/":
                    if (this.stringToParse[this.currentLoc + 1] === "=") {
                        type = "SLASH_EQUAL";
                        this.currentLoc += 2;
                        break;
                    }
                    type = "SLASH";
                    this.currentLoc++;
                    break;
                case "%":
                    if (this.stringToParse[this.currentLoc + 1] === "=") {
                        type = "PERCENT_EQUAL";
                        this.currentLoc += 2;
                        break;
                    }
                    type = "PERCENT";
                    this.currentLoc++;
                    break;
                case ":":
                    type = "COLON";
                    this.currentLoc++;
                    break;
                case "?":
                    type = "QMARK";
                    this.currentLoc++;
                    break;
                case "!":
                    if (this.stringToParse[this.currentLoc + 1] === "=") {
                        type = "BANG_EQUAL";
                        this.currentLoc += 2;
                        break;
                    }
                    type = "BANG";
                    this.currentLoc++;
                    break;
                case "=":
                    if (this.stringToParse[this.currentLoc + 1] === "=") {
                        type = "EQUAL_EQUAL";
                        this.currentLoc += 2;
                        break;
                    }
                    type = "EQUAL";
                    this.currentLoc++;
                    break;
                case "<":
                    if (this.stringToParse[this.currentLoc + 1] === "=") {
                        type = "LESS_EQUAL";
                        this.currentLoc++;
                        break;
                    } else if (this.stringToParse[this.currentLoc + 1] === "{") {
                        type = "OBJECT-OPENING";
                        this.currentLoc += 2;
                        break;
                    }
                    type = "LESS";
                    this.currentLoc++;
                    break;
                case ">":
                    if (this.stringToParse[this.currentLoc + 1] === "=") {
                        type = "GREATER_EQUAL";
                        this.currentLoc += 2;
                        break;
                    }
                    type = "GREATER";
                    this.currentLoc++;
                    break;
                // !! Deprecated !!
                // case "|":
                //     if (this.stringToParse[this.currentLoc + 1] === "|") {
                //         type = "OR";
                //         this.currentLoc += 2;
                //         break;
                //     }
                //     this.currentLoc++;
                //     this.riseLexicalError(this.currentLoc, "Bitwise operations are not supported. Did you mean ||?");
                //     continue;
                // case "&":
                //     if (this.stringToParse[this.currentLoc + 1] === "&") {
                //         type = "AND";
                //         this.currentLoc += 2;
                //         break;
                //     }
                //     this.currentLoc++;
                //     this.riseLexicalError(this.currentLoc, "Bitwise operations are not supported. Did you mean &&?");
                //     continue;
                case "#":
                    if (this.stringToParse[this.currentLoc + 1] === "{") {
                        this.skipBlockComment();
                        continue;
                    }
                    this.skipInlineComment();
                    continue;
                case "@":
                    if (/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/\d]/.test(this.stringToParse[this.currentLoc + 1])) {
                        this.riseLexicalError(startToken,
                            "Variables names can't start with numbers nor with special characters!");
                        this.currentLoc++;
                        for (/*No initialization*/; !this.isTheEnd(); this.currentLoc++) {
                            if (/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/\s]/
                            .test(this.stringToParse[this.currentLoc])) {
                                break;
                            }
                        }
                        continue;
                    }
                    this.currentLoc++;
                    for (/*No initialization*/; !this.isTheEnd(); this.currentLoc++) {
                        if (/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/\s]/
                            .test(this.stringToParse[this.currentLoc])) {
                            break;
                        }
                    }
                    if (this.stringToParse.slice(startToken, this.currentLoc).length === 1) {
                        this.riseLexicalError(startToken, "Unexpected variable name.");
                        continue;
                    }
                    type = "IDENTIFIER";
                    break;

                case "\u0022": /* \u0022 = "\"" */
                    this.currentLoc++;
                    for (/*No initialization*/; !this.isTheEnd(); this.currentLoc++) {
                        if ((this.stringToParse[this.currentLoc] === "\u0022"
                            && this.stringToParse[this.currentLoc - 1] !== "\\") ||
                            this.stringToParse[this.currentLoc] === "\n") {
                                break;
                            }
                        }
                    if (this.stringToParse[this.currentLoc] === "\u0022") {
                        type = "STRING";
                        token = this.stringToParse.slice(startToken + 1, this.currentLoc++);
                        break;
                    }
                    this.riseLexicalError(startToken, "Unterminated string. Expected \u0022");
                    this.currentLoc++;
                    continue;
                case "`":
                    this.currentLoc++;
                    for (/*No initialization*/; !this.isTheEnd(); this.currentLoc++) {
                        if ((this.stringToParse[this.currentLoc] === "`"
                            && this.stringToParse[this.currentLoc - 1] !== "\\") ||
                            this.stringToParse[this.currentLoc] === "\n") {
                                break;
                            }
                        }
                    if (this.stringToParse[this.currentLoc] === "`") {
                        type = "STRING_INTER";
                        token = this.stringToParse.slice(startToken + 1, this.currentLoc++);
                        break;
                    }
                    this.riseLexicalError(startToken, "Unterminated string. Expected `");
                    this.currentLoc++;
                    continue;
                case "'":
                    this.currentLoc++;
                    for (/*No initialization*/; !this.isTheEnd(); this.currentLoc++) {
                        if ((this.stringToParse[this.currentLoc] === "'"
                            && this.stringToParse[this.currentLoc - 1] !== "\\") ||
                            this.stringToParse[this.currentLoc] === "\n") {
                                break;
                            }
                        }
                    if (this.stringToParse[this.currentLoc] === "'") {
                        type = "STRING_TEMPL";
                        token = this.stringToParse.slice(startToken + 1, this.currentLoc++);
                        break;
                    }
                    this.riseLexicalError(startToken, "Unterminated string. Expected '");
                    this.currentLoc++;
                    continue;
                default:
                    if (this.isDigit(this.stringToParse[this.currentLoc])) {
                        type = "NUMBER";
                        if (this.stringToParse[this.currentLoc] === "0") {
                            this.currentLoc++;
                            if (this.stringToParse[this.currentLoc] === "x") {
                                this.currentLoc++;
                                for (/*No initialization*/; !this.isTheEnd() &&
                                this.isHex(this.stringToParse[this.currentLoc]); this.currentLoc++) {
                                    ;
                                }
                                token = Number.parseInt(this.stringToParse.slice(startToken, this.currentLoc), 16);
                                break;
                            } else {
                                for (/*No initialization*/; !this.isTheEnd() &&
                                this.isOct(this.stringToParse[this.currentLoc]); this.currentLoc++) {
                                    ;
                                }
                                if (!this.isDigit(this.stringToParse[this.currentLoc])) {
                                    token = Number.parseInt(this.stringToParse.slice(startToken, this.currentLoc), 8);
                                    break;
                                }
                                this.currentLoc++;
                            }
                        }
                        for (/*No initialization*/; !this.isTheEnd() &&
                                this.isDigit(this.stringToParse[this.currentLoc]); this.currentLoc++) {
                            ;
                        }
                        if (this.stringToParse[this.currentLoc] === "." &&
                            this.isDigit(this.stringToParse[this.currentLoc + 1])) {
                            this.currentLoc++;
                            for (/*No initialization*/; !this.isTheEnd() &&
                                this.isDigit(this.stringToParse[this.currentLoc]); this.currentLoc++) {
                                    ;
                                }
                        }
                        token = Number.parseFloat(this.stringToParse.slice(startToken, this.currentLoc));
                        break;
                    }
                    if (/[A-z]/.test(this.stringToParse[this.currentLoc])) {
                        this.currentLoc++;
                        for (/*No initialization*/; !this.isTheEnd()
                            && /[A-z\_\d]/.test(this.stringToParse[this.currentLoc]); this.currentLoc++) {
                                ;
                            }
                        if (this.keywords.includes(` ${this.stringToParse.slice(startToken, this.currentLoc)} `)) {
                            type = this.stringToParse.slice(startToken, this.currentLoc).toUpperCase();
                            if (type === "TRUE") {
                                token = true;
                            } else if (type === "FALSE") {
                                token = false;
                            } else {
                                token = type.toLowerCase();
                            }
                            break;
                        } else if (this.tokens[this.tokens.length - 1].type === "DOT") {
                            type = "IDENTIFIER";
                            token = this.stringToParse.slice(startToken, this.currentLoc);
                            break;
                        }
                        this.riseLexicalError(startToken, "Unknown keyword!");
                        this.currentLoc++;
                        continue;
                    }
                    this.riseLexicalError(startToken, "Unexpected character!");
                    while (!this.isWhiteSpace(this.stringToParse[++this.currentLoc]) && !this.isTheEnd()) {
                        ;
                    }
                    continue;
            }

            this.tokens.push({
                end: this.currentLoc - 1,
                start: startToken,
                token: token !== undefined ? token :
                    this.unescapeChar(this.stringToParse.slice(startToken, this.currentLoc)),
                type,
            });
        }
        return {
            errors: this.errorList,
            tokens: this.tokens,
        };
    }

    private __INIT__(str: string): void {
        this.stringToParse = str;
        this.currentLoc = 0;
        this.currentCommentNest = 0;
        this.errorList = [];
        this.tokens = [];
    }

    private riseLexicalError(loc: number, message: string): void {
        const loct: number[] = this.getLoc(loc);
        this.errorList.push(`At [${loct[0]}:${loct[1]}] >${message}`);
    }

    private unescapeChar(text: string): string {
        const chars = {
            "\\": "\"",
            "\\\\": "\\",
            "\\n": "\n",
            "\\t": "\t",
        };
        text = text.replace(/\\(.)/g, (match: string): string => {
            return chars[match] as string;
        });
        return text.replace(/\\u[\dA-F]{4}/gi,
                (match: string): string => {
                    return String.fromCharCode(parseInt(match.replace(/\\u/g, ""), 16));
               });
     }

    private isTheEnd(): boolean {
        return  this.stringToParse[this.currentLoc] === undefined;
    }

    private isDigit(text: string): boolean {
        return text.charCodeAt(0) >= 48 && text.charCodeAt(0) <= 57;
    }

    private isHex(text: string): boolean {
        return "0123456789abcdef".includes(text.toLocaleLowerCase());
    }

    private isOct(text: string): boolean {
        return text.charCodeAt(0) >= 48 && text.charCodeAt(0) <= 55;
    }

    private isWhiteSpace(text: string): boolean {
        return "\u0020\u00a0\u205f\u3000\u1680\u180e\u200a\u202f\u2000\u000a\t\r".includes(text);
    }

    private skipInlineComment(): void {
        for (/*No initialization*/; !this.isTheEnd(); this.currentLoc++) {
            if (this.stringToParse[this.currentLoc] === "\n") {
                    break;
            }
        }
        ++this.currentLoc;
    }

    private skipBlockComment(): void {
        for (/*No initialization*/; !this.isTheEnd(); this.currentLoc++) {
            if (this.stringToParse[ this.currentLoc] === "#" && this.stringToParse[ this.currentLoc + 1] === "{") {
                this.currentCommentNest++;
            }
            if (this.stringToParse[ this.currentLoc] === "}" && this.stringToParse[ this.currentLoc + 1] === "#") {
                this.currentCommentNest--;
            }
            if (this.currentCommentNest === 0) {
                    break;
            }
        }
        this.currentLoc += 2;
    }

    private toggleException(): never {
        throw Error("Toggled!");
    }
}
