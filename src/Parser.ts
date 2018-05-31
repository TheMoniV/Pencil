/// <reference path="./AST/Expression.ts" />
/// <reference path="./AST/Statement.ts" />

class Parser {
    private tokens: IToken[];
    private currentToken: number;
    private errorList: string[];
    private loopNesting: number;
    private getLoc: (loc: number) => number[];

    public constructor(getLoc: (loc: number) => number[], tokens?: IToken[]) {
        this.currentToken = 0;
        this.tokens = tokens || [];
        this.getLoc = getLoc;
        this.loopNesting = 0;
        this.errorList = [];
    }

    public toggleException(): never {
        throw Error("Toggled!");
    }

    public parse(tokens?: IToken[]): IParserResult {
        this.__INIT__(tokens);
        let statements: Statement[] = [];

        while (!this.isTheEnd()) {
            statements = statements.concat(this.declaration());
        }
        return {
            AST: statements,
            errors: this.errorList,
        };
    }

    // Helpers which will be used by the parser during its parsing.

    private __INIT__(tokens?: IToken[]): void {
        this.currentToken = 0;
        this.tokens = tokens || this.tokens;
        this.loopNesting = 0;
        this.errorList = [];
    }

    private riseSyntacticalError(token: IToken, errorMessage: string): void {
        const loc: number[] = this.getLoc(token.start);
        this.errorList.push(`At [${loc[0]}:${loc[1]}] >${errorMessage}`);
        throw Error();
    }

    private synchronize(): void {
        this.moveToTheNextToken();
        while (!this.isTheEnd()) {
            if (this.getPreviousToken().type === "SEMICOLON") {
                return;
            }

            switch (this.getCurrentToken().type) {
                case "FUN":
                case "LET":
                case "CONST":
                case "IF":
                case "WHILE":
                case "RETURN":
                  return;
              }
            this.moveToTheNextToken();
        }
    }

    private isTheEnd(): boolean {
        return this.tokens.length === this.currentToken;
    }

    private getCurrentToken(): IToken {
        return this.tokens[this.currentToken];
    }

    private getPreviousToken(): IToken {
        return this.tokens[this.currentToken - 1];
    }

    private moveToTheNextToken(): IToken {
        if (!this.isTheEnd()) {
            this.currentToken++;
        }
        return this.getPreviousToken();
    }

    private checkType(type: string): boolean {
        if (this.isTheEnd()) { return false; }
        return this.getCurrentToken().type === type;
    }

    private match(...types: string[]): boolean {
        for (const type of types) {
            if (this.checkType(type)) {
                this.moveToTheNextToken();
                return true;
            }
        }
        return false;
    }

    private expect(type: string, errorMessage: string): void | IToken {
        if (this.checkType(type)) {
            return this.moveToTheNextToken();
        }
        this.riseSyntacticalError(this.getPreviousToken(), errorMessage);
    }

    // Implementing Pencil program grammar:

    private declaration(): Statement[] | Statement {
        try {
            if (this.match("LET", "CONST")) {
            return this.varDeclaration();
            }
            return this.statement();
        } catch (e) {
            this.synchronize();
        }
    }

    private varDeclaration(): Statement[] {
        let identifier: IToken | void;
        let init: Expression | undefined;
        let type: string;
        const declarations: Statement[] = [];
        if (this.getPreviousToken().type === "CONST") {
            type = "CONST";
            do {
                identifier = this.expect("IDENTIFIER", "Expect constant name.") as IToken;
                this.expect("EQUAL", "Missing initializer in const declaration.");
                init = this.expression();
                if (init === undefined) {
                    this.riseSyntacticalError(this.getPreviousToken(),
                        `Unexpected token ${this.getCurrentToken().token}`);
                }
                declarations.push(new VariableDeclaration(identifier, init, type));
            } while (this.match("COMMA"));
        } else {
            type = "LET";
            do {
                identifier = this.expect("IDENTIFIER", "Expect variable name.");
                if (this.match("EQUAL")) {
                    init = this.expression();
                }
                declarations.push(new VariableDeclaration(identifier, init, type));
            } while (this.match("COMMA"));
        }

        this.expect("SEMICOLON", "Expect ';' after variable declaration.");
        return declarations;
    }

    private statement(): Statement {
        if (this.match("LEFT_BRACE")) {
            return new BlockStatement(this.block());
        }
        if (this.match("CONSOLE")) {
            const expr: Statement = this.expressionStatement();
            return new ConsoleStatement((expr as ExpressionStatement).getExpression());
        }
        if (this.match("IF")) {
            return this.ifStatement();
        }
        if (this.match("WHILE")) {
            return this.whileStatement();
        }
        if (this.match("FOR")) {
            return this.forStatement();
        }
        if (this.match("BREAK")) {
            if (this.loopNesting === 0) {
                this.riseSyntacticalError(this.getPreviousToken(), "Illegal break statement.");
            }
            this.expect("SEMICOLON", "Expected ';' after break.");
            return new BreakStatement(this.getPreviousToken());
        }
        if (this.match("CONTINUE")) {
            if (this.loopNesting === 0) {
                this.riseSyntacticalError(this.getPreviousToken(), "Illegal continue statement.");
            }
            this.expect("SEMICOLON", "Expected ';' after continue.");
            return new ContinueStatement(this.getPreviousToken());
        }
        return this.expressionStatement();
    }

    private block(): Statement[] {
        let statements: Statement[] = [];

        while (!this.checkType("RIGHT_BRACE") && !this.isTheEnd()) {
            statements = statements.concat(this.declaration());
        }

        this.expect("RIGHT_BRACE", "Expect '}' after block.");
        return statements;
    }

    private ifStatement(): Statement {
        this.expect("LEFT_PAREN", "Expect '(' after 'if'.");

        const condition: Expression = this.expression();
        if (condition === undefined) {
            this.riseSyntacticalError(this.getPreviousToken(), "Expect an expression.");
        }
        this.expect("RIGHT_PAREN", "Expect ')' after if condition.");

        const thenBranch: Statement = this.statement();
        let elseBranch: Statement | undefined;
        if (this.match("ELSE")) {
            elseBranch = this.statement();
        }
        return new IfThenStatement(condition, thenBranch, elseBranch);
    }

    private whileStatement(): Statement {
        this.expect("LEFT_PAREN", "Expect '(' after 'while'.");

        const condition: Expression = this.expression();
        if (condition === undefined) {
            this.riseSyntacticalError(this.getPreviousToken(), "Expect an expression.");
        }
        this.expect("RIGHT_PAREN", "Expect ')' after while condition.");

        this.loopNesting++;
        const whileBody: Statement | undefined = this.statement();
        this.loopNesting--;

        return new WhileStatement(condition, whileBody);
    }

    private forStatement(): Statement {
        this.expect("LEFT_PAREN", "Expect '(' after 'for'.");

        let init: Statement[] | undefined;
        let condition: Expression | undefined;
        let incr: Expression | undefined;
        let body: Statement | undefined;

        if (this.match(";")) {
            init = undefined;
        } else if (this.match("LET")) {
            init = this.varDeclaration();
        } else {
            this.expressionStatement();
        }
        if (!this.match("SEMICOLON")) {
            condition = this.expression();
        }
        this.expect("SEMICOLON", "Expect ';' after loop condition.");
        if (!this.match("SEMICOLON")) {
            incr = this.expression();
        }
        this.expect("RIGHT_PAREN", "Expect ')' after for clauses.");

        this.loopNesting++;
        body = this.statement();
        this.loopNesting--;

        if (condition === undefined) {
            condition = new Literal(true);
        }
        return new ForStatement(condition, init, incr, body);
}

    private expressionStatement(): Statement {
        const expr: Expression = this.expression();
        this.expect("SEMICOLON", "Expect ';' after expression.");

        return new ExpressionStatement(expr);
    }

    // Implementing Pencil expression grammar:

    private expression(): Expression {
        return this.assignment();
    }

    private assignment(): Expression {
        const expr: Expression = this.or();
        let op2: IToken;
        let right: Expression;

        if (this.match("EQUAL", "PLUS_EQUAL", "MINUS_EQUAL", "STAR_EQUAL", "SLASH_EQUAL")) {
            const op: IToken = this.getPreviousToken();
            const value: Expression = this.assignment();

            if (expr instanceof VariableExpression) {
                if (op.type === "EQUAL") {
                        return new AssignExpression((expr as VariableExpression).getIdentifier(), value);
                } else {
                    op2 = {
                        end: op.end,
                        start: op.start,
                        token: op.token.toString().slice(0, 1),
                        type: op.type.split("_")[0],
                    };
                    right = new BinaryExpression(
                            new VariableExpression((expr as VariableExpression).getIdentifier()), op2, value);
                    return new AssignExpression((expr as VariableExpression).getIdentifier(), right);
                }
            }

            this.riseSyntacticalError(op, "Invalid assignment target.");
        }

        return expr;
    }

    private or(): Expression {
        let expr: Expression = this.and();

        if (this.match("OR")) {
            const operator: IToken = this.getPreviousToken();
            const right: Expression = this.and();
            expr = new Logical(expr, operator, right);
        }

        return expr;
    }

    private and(): Expression {
        let expr: Expression = this.trinary();

        if (this.match("AND")) {
            const operator: IToken = this.getPreviousToken();
            const right: Expression = this.trinary();
            expr = new Logical(expr, operator, right);
        }

        return expr;
    }

    private trinary(): Expression {
        let condition: Expression = this.equality();

        if (this.match("QMARK")) {
            if (condition === undefined) {
                this.riseSyntacticalError(this.getPreviousToken(), "Expected an expression before '?'");
            }
            const left: Expression = this.trinary();
            if (left === undefined) {
                this.riseSyntacticalError(this.getPreviousToken(), "Expected an expression after '?'");
            }
            this.expect("COLON", "Expected ':'.");
            const right: Expression = this.trinary();
            if (right === undefined) {
                this.riseSyntacticalError(this.getPreviousToken(), "Expected an expression after ':'");
            }
            condition = new TrinaryExpression(condition, left, right);
        }
        return condition;
    }

    private equality(): Expression {
        let expr: Expression = this.comparison();

        while (this.match("BANG_EQUAL", "EQUAL_EQUAL")) {
            const op: IToken = this.getPreviousToken();
            const right: Expression = this.comparison();
            expr = new BinaryExpression(expr, op, right);
        }

        return expr;
    }

    private comparison(): Expression {
        let expr: Expression = this.addition();

        while (this.match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
            const op: IToken = this.getPreviousToken();
            const right: Expression = this.addition();
            expr = new BinaryExpression(expr, op, right);
        }

        return expr;
    }

    private addition(): Expression {
        let expr: Expression = this.multiplication();

        while (this.match("PLUS", "MINUS")) {
            const op: IToken = this.getPreviousToken();
            const right: Expression = this.multiplication();
            expr = new BinaryExpression(expr, op, right);
        }

        return expr;
    }

    private multiplication(): Expression {
        let expr: Expression = this.unary();

        while (this.match("STAR", "SLASH")) {
            const op: IToken = this.getPreviousToken();
            const right: Expression = this.unary();
            expr = new BinaryExpression(expr, op, right);
        }

        return expr;
    }

    private unary(): Expression {
        if (this.match("PLUS", "MINUS", "BANG", "TYPEOF", "PLUS_PLUS", "MINUS_MINUS")) {
            const op: IToken = this.getPreviousToken();
            const right: Expression = this.unary();

            if ((op.type === "PLUS_PLUS" || op.type === "MINUS_MINUS") && !(right instanceof VariableExpression)) {
                this.riseSyntacticalError(op, "Invalid left-hand side in prefix operation");
            }

            return new UnaryExpression(op, right);
        }

        return this.postfix();
    }

    private postfix(): Expression {
        const expr: Expression = this.literal();

        if (this.match("PLUS_PLUS", "MINUS_MINUS")) {
            const op: IToken = this.getPreviousToken();
            if (expr instanceof VariableExpression) {
                const op2: IToken = {
                    end: op.end,
                    start: op.start,
                    token: op.token.toString().slice(0, 1),
                    type: op.type.split("_")[0],
                };
                const right: Expression = new BinaryExpression(
                        new VariableExpression((expr as VariableExpression).getIdentifier()), op2,
                            new Literal(op.type === "PLUS_PLUS" ? 1 : -1));
                return new AssignExpression((expr as VariableExpression).getIdentifier(), right, "BEFORE");
            }

            this.riseSyntacticalError(this.getPreviousToken(),
                                    "Invalid left-hand side expression in prefix operation.");
        }

        return expr;
    }

    private literal(): Expression {
        if (this.match("NULL")) {
            return new Literal(null);
        }
        if (this.match("TRUE")) {
            return new Literal(true);
        }
        if (this.match("FALSE")) {
            return new Literal(false);
        }

        if (this.match("NUMBER", "STRING")) {
            return new Literal(this.getPreviousToken().token);
        }

        if (this.match("STRING_INTER")) {
            return new StringInterpolation(this.getPreviousToken().token as string);
        }

        if (this.match("IDENTIFIER")) {
            return new VariableExpression(this.getPreviousToken());
        }

        if (this.match("LEFT_PAREN")) {
            const expr: Expression = this.expression();
            this.expect("RIGHT_PAREN", "Expect ')' after expression.");

            return new GroupingExpression(expr);
        }
    }

}
