/// <reference path="./Lexer.ts" />
/// <reference path="./Parser.ts" />
/// <reference path="./Interpreter.ts" />

class Pencil {
    private lexer: Lexer;
    private parser: Parser;
    private interpreter: Interpreter;
    private script: string;

    public constructor() {
        this.lexer = new Lexer(this.getLoc);
        this.parser = new Parser(this.getLoc);
        this.interpreter = new Interpreter();
        this.script = "";
    }

    public getLoc = (loc: number): number[] => {
        let line: number = 1;
        let indx: number = 0;
        const subArr: string = this.script.slice(0, loc);
        for (let i: number = 0; i < subArr.length; i++) {
            if (subArr[i] === "\n") {
                line++;
                indx = i;
            }
        }
        return [line, loc - indx];
    }

    public exec(script: string): any {
        let lexerResult: ILexerResult;
        let parserResult: IParserResult;

        if (script.length === 0) {
            return undefined;
        }
        this.script = script;
        lexerResult = this.lexer.parse(script);
        if (lexerResult.errors.length > 0) {
            for (const error of lexerResult.errors) {
                console.error("Lexical Error: " + error);
            }
            return;
        } else {
            parserResult = this.parser.parse(lexerResult.tokens);
            if (parserResult.errors.length > 0) {
                for (const error of parserResult.errors) {
                    console.error("Syntactical Error: " + error);
                }
                return;
            } else {
                return this.interpreter.exec(parserResult.AST);
            }
        }
    }
}