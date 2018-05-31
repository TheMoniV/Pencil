/*
* The very first implementation of Pencil interpreter.
* Hammadi Agharass - Alten 2018
* This file is under MIT license. 
* @File: Statement.ts
* @Description: This file contains classes of all statements of Pencil.
*/

/// <reference path="./Interfaces.ts" />

class ExpressionStatement implements Statement {
    private expression: Expression;

    public constructor(exprs: Expression) {
        this.expression = exprs;
    }

    public getExpression(): Expression {
        return this.expression;
    }
    public accept(visitor: StatementVisitor): void {
        visitor.visitExpressionStatement(this);
    }
}

class ConsoleStatement implements Statement {
    private expr: Expression;

    public constructor(expr: Expression) {
        this.expr = expr;
    }

    public getExpression(): Expression {
        return this.expr;
    }

    public accept(visitor: StatementVisitor) {
        visitor.visitConsoleStatement(this);
    }
}

class VariableDeclaration implements Statement {
    private identifier: IToken;
    private type: string;
    private expression: Expression | undefined;

    public constructor(identifier: IToken, expression: Expression | undefined, type: string) {
        this.identifier = identifier;
        this.type = type;
        this.expression = expression;
    }

    public getExpression(): Expression | undefined {
        return this.expression;
    }

    public getType(): string {
        return this.type;
    }

    public getIdentifier(): IToken {
        return this.identifier;
    }

    public accept(visitor: StatementVisitor): any {
        return visitor.visitVariableDeclaration(this);
    }
}

class BlockStatement implements Statement {
    private statements: Array<Statement | undefined>;

    public constructor(statements: Array<Statement | undefined>) {
        this.statements = statements;
    }

    public getStatements(): Array<Statement | undefined> {
        return this.statements;
    }

    public accept(visitor: StatementVisitor) {
        visitor.visitBlockStatement(this);
    }
}

class IfThenStatement implements Statement {
    private condition: Expression;
    private thenBranch: Statement;
    private elseBranch: Statement | undefined;

    public constructor(condition: Expression, thenBranch: Statement, elseBranch?: Statement) {
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
    }

    public getCondition(): Expression {
        return this.condition;
    }

    public getThenBranch(): Statement {
        return this.thenBranch;
    }

    public getElseBranch(): Statement | undefined {
        return this.elseBranch;
    }

    public accept(visitor: StatementVisitor): void {
        visitor.visitIfThenStatement(this);
    }
}

class WhileStatement implements Statement {
    private condition: Expression;
    private whileBody: Statement | undefined;

    public constructor(condition: Expression, whileBody: Statement | undefined) {
        this.condition = condition;
        this.whileBody = whileBody;
    }

    public getCondition(): Expression {
        return this.condition;
    }

    public getWhileBody(): Statement | undefined {
        return this.whileBody;
    }

    public accept(visitor: StatementVisitor): void {
        visitor.visitWhileStatement(this);
    }
}

class ForStatement implements Statement {
    private init: Statement[] | undefined;
    private condition: Expression;
    private incr: Expression | undefined;
    private body: Statement | undefined;

    public constructor(condition: Expression, init?: Statement[], incr?: Expression, body?: Statement) {
        this.init = init;
        this.condition = condition;
        this.incr = incr;
        this.body = body;
    }

    public getInit(): Statement[] | undefined {
        return this.init;
    }

    public getCondition(): Expression {
        return this.condition;
    }

    public getIncr(): Expression | undefined {
        return this.incr;
    }

    public getBody(): Statement | undefined {
        return this.body;
    }

    public accept(visitor: StatementVisitor): void {
        return visitor.visitForStatement(this);
    }

}

class BreakStatement implements Statement {
    private token: IToken;

    public constructor(token: IToken) {
        this.token = token;
    }

    public getToken(): IToken {
        return this.token;
    }

    public accept(visitor: StatementVisitor): void {
        visitor.visitBreakStatement(this);
    }
}

class ContinueStatement implements Statement {
    private token: IToken;

    public constructor(token: IToken) {
        this.token = token;
    }

    public getToken(): IToken {
        return this.token;
    }

    public accept(visitor: StatementVisitor): void {
        visitor.visitContinueStatement(this);
    }
}
