abstract class Statement {
    public abstract accept(visitor: StatementVisitor): any;
}

abstract class Expression {
    public abstract accept(visitor: ExpressionVisitor): any;
}

abstract class ExpressionVisitor {
    public abstract visitAssignExpression(assignExpr: AssignExpression): any;
    public abstract visitTrinaryExpression(trinaryExpr: TrinaryExpression): any;
    public abstract visitLogicalExpression(logicalExpr: Logical): any;
    public abstract visitBinaryExpression(binaryExpr: BinaryExpression): any;
    public abstract visitUnaryExpression(unaryExpr: UnaryExpression): any;
    public abstract visitVariableExpression(varExpr: VariableExpression): any;
    public abstract visitLiteral(literal: Literal): any;
    public abstract visitStringInterpolation(stringIntr: StringInterpolation): string;
    public abstract visitGroupingExpression(grouping: GroupingExpression): any;
}

abstract class StatementVisitor {
    public abstract visitExpressionStatement(expressionStmt: ExpressionStatement): void;
    public abstract visitConsoleStatement(consoleStmt: ConsoleStatement): void;
    public abstract visitVariableDeclaration(varDeclaration: VariableDeclaration): void;
    public abstract visitBlockStatement(blockStmt: BlockStatement): void;
    public abstract visitIfThenStatement(ifThenStmt: IfThenStatement): void;
    public abstract visitWhileStatement(whileStatment: WhileStatement): void;
    public abstract visitForStatement(forStatment: ForStatement): void;
    public abstract visitBreakStatement(breakStmt: BreakStatement): void;
    public abstract visitContinueStatement(continueStmt: ContinueStatement): void;
}

interface IToken {
    type: string;
    token: string | number | boolean;
    start: number;
    end: number;
}

interface ILexerResult {
    errors: string[];
    tokens: IToken[];
}

interface IParserResult {
    AST: Statement[];
    errors: string[];
}
