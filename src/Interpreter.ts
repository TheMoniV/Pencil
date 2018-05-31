/// <reference path="./AST/Expression.ts" />
/// <reference path="./AST/Statement.ts" />
/// <reference path="./Environment.ts" />

class Interpreter implements ExpressionVisitor, StatementVisitor {
    private program: Statement[];
    private env: Environment;

    constructor(program?: Statement[]) {
        this.program = program || [];
        this.env = new Environment();
    }

    public exec(program?: Statement[]): void {
        this.program = program || this.program;
        try {
            for (const statement of this.program) {
                statement.accept(this);
            }
        } catch (e) {
            if (e.message === "BRK") {
                console.error(`${e.message} >Illegal break statement`);
            } else if (e.message === "CNT") {
                console.error(`${e.message} >Illegal continue statement`);
            } else {
                console.error(e.message);
            }
        }

    }

    public evalExpression(expr?: Expression): any {
        if (expr === undefined) {
            return null;
        }
        return expr.accept(this);
    }

    // Implementing Expression Visitor:

    public visitLiteral(literal: Literal): any {
        return literal.getValue();
    }

    public visitStringInterpolation(stringIntr: StringInterpolation): string {
        return stringIntr.getValue().replace(/@[^\s`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/]+/g,
            (match: string): string => {
                if (this.env.isThere(match)) {
                    return this._escapeString(this.env.getVar(match));
                }
                return match;
        });
    }

    public visitAssignExpression(assignExpr: AssignExpression): any {
        const result: any = this.evalExpression(assignExpr.getExpression());
        const oldVal: any = this.env.getVar(assignExpr.getIdentifier().token.toString());

        this.env.assign(assignExpr.getIdentifier(), result);

        if (assignExpr.getReturnType() === "BEFORE") {
            return oldVal;
        }
        return result;
    }

    public visitLogicalExpression(logicalExpr: Logical): any {
        const left: any = this.evalExpression(logicalExpr.getLeftOperand());

        if (logicalExpr.getOperator().type === "OR") {
            if (this.convertToPencilBoolean(left)) {
                return left;
            }
        } else {
            if (!this.convertToPencilBoolean(left)) {
                return left;
            }
        }

        return this.evalExpression(logicalExpr.getRightOperand());
    }

    public visitTrinaryExpression(trinaryExpr: TrinaryExpression): any {
        const conditionResult: any = this.evalExpression(trinaryExpr.getCondition());

        if (this.convertToPencilBoolean(conditionResult) === true) {
            return this.evalExpression(trinaryExpr.getLeftOperand());
        }
        return this.evalExpression(trinaryExpr.getRightOperand());
    }

    public visitBinaryExpression(binaryExpr: BinaryExpression): any {
        const leftResult: any = this.evalExpression(binaryExpr.getLeftOperand());
        const rightResult: any = this.evalExpression(binaryExpr.getRightOperand());

        if (this.checkOperator(binaryExpr.getOperator(), leftResult, rightResult)) {
            switch (binaryExpr.getOperator().type) {
                case "PLUS":
                    return leftResult + rightResult;
                case "MINUS":
                    return leftResult - rightResult;
                case "STAR":
                    return leftResult * rightResult;
                case "SLASH":
                    return leftResult / rightResult;
                case "EQUAL_EQUAL":
                    return leftResult === rightResult;
                case "BANG_EQUAL":
                    return leftResult !== rightResult;
                case "GREATER":
                    return leftResult > rightResult;
                case "GREATER_EQUAL":
                    return leftResult >= rightResult;
                case "LESS":
                    return leftResult < rightResult;
                case "LESS_EQUAL":
                    return leftResult <= rightResult;
            }
        }
    }

    public visitUnaryExpression(unaryExpr: UnaryExpression): any {
        let id: IToken;
        if (unaryExpr.getOperator().type === "PLUS_PLUS") {
            id = (unaryExpr.getRightOperand() as VariableExpression).getIdentifier();

            if (typeof this.env.getVar(id.token.toString()) !== "number") {
                this.riseSemanticalError(unaryExpr.getOperator(), "Variable must contain a number.");
            }
            this.env.assign(id, this.env.getVar(id.token.toString()) + 1);

            return this.env.getVar(id.token.toString());

        } else if (unaryExpr.getOperator().type === "MINUS_MINUS") {

            id = (unaryExpr.getRightOperand() as VariableExpression).getIdentifier();
            if (typeof this.env.getVar(id.token.toString()) !== "number") {
                this.riseSemanticalError(unaryExpr.getOperator(), "Variable must contain a number.");
            }
            this.env.assign(id, this.env.getVar(id.token.toString()) - 1);

            return this.env.getVar(id.token.toString());
        }

        const result: any = this.evalExpression(unaryExpr.getRightOperand());
        switch (unaryExpr.getOperator().type) {
            case "PLUS":
                if (this.checkOperator(unaryExpr.getOperator(), result)) {
                    return result;
                }
                break;
            case "MINUS":
                if (this.checkOperator(unaryExpr.getOperator(), result)) {
                    return -result;
                }
                break;
            case "BANG":
                if (this.checkOperator(unaryExpr.getOperator(), result)) {
                    return !this.convertToPencilBoolean(result);
                }
            case "TYPEOF":
                return typeof result;
            default:
                // unreachable
        }
    }

    public visitGroupingExpression(grouping: GroupingExpression): any {
        return this.evalExpression(grouping.getExpression());
    }

    public visitVariableExpression(varExpr: VariableExpression): any {
        return this.env.getVar(varExpr.getIdentifier().token.toString());
    }

    // Implementing Statement Visitor:

    public visitConsoleStatement(consoleStmt: ConsoleStatement): void {
        console.log(this.evalExpression(consoleStmt.getExpression()));
    }

    public visitVariableDeclaration(varDeclaration: VariableDeclaration): void {
        let value: any = null;
        if (varDeclaration.getExpression() !== undefined) {
            value = this.evalExpression(varDeclaration.getExpression());
        }
        if (varDeclaration.getType() === "CONST") {
            this.env.defineConst(varDeclaration.getIdentifier().token.toString(), value);
            return;
        }
        this.env.defineVar(varDeclaration.getIdentifier().token.toString(), value);
    }

    public visitExpressionStatement(expressionStmt: ExpressionStatement): void {
        this.evalExpression(expressionStmt.getExpression());
    }

    public visitBlockStatement(blockStmt: BlockStatement): void {
        const previousEnv: Environment = this.env;

        try {
            this.env = new Environment(this.env);
            const statements: Array<Statement | undefined> = blockStmt.getStatements();
            for (const statement of statements) {
                if (statement !== undefined) {
                    statement.accept(this);
                }
            }
        } finally {
            this.env = previousEnv;
        }
    }

    public visitIfThenStatement(ifThenStmt: IfThenStatement): void {

        if (this.convertToPencilBoolean(this.evalExpression(ifThenStmt.getCondition()))) {
            ifThenStmt.getThenBranch().accept(this);
        } else if (ifThenStmt.getElseBranch() !== undefined) {
            (ifThenStmt.getElseBranch() as Statement).accept(this);
        }
    }

    public visitWhileStatement(whileStmt: WhileStatement): void {
        do {
            try {
                while (this.convertToPencilBoolean(this.evalExpression(whileStmt.getCondition()))) {
                    if (whileStmt.getWhileBody() !== undefined) {
                        (whileStmt.getWhileBody() as Statement).accept(this);
                    }
                }
                break;
            } catch (e) {
                if (e.message === "BRK") {
                    return;
                } else if (e.message === "CNT") {
                    continue;
                } else {
                    throw Error(e.message);
                }
            }
        } while (true);
    }

    public visitForStatement(forStmt: ForStatement): void {
        const previousEnv: Environment = this.env;
        this.env = new Environment(this.env);
        if (forStmt.getInit() !== undefined) {
            for (const stmt of (forStmt.getInit() as Statement[])) {
                stmt.accept(this);
            }
        }
        do {
            try {
                while (this.convertToPencilBoolean(this.evalExpression(forStmt.getCondition()))) {
                    if (forStmt.getBody() !== undefined) {
                        (forStmt.getBody() as Statement).accept(this);
                    }
                    this.evalExpression(forStmt.getIncr());
                }
                break;
            } catch (e) {
                if (e.message === "BRK") {
                    break;
                } else if (e.message === "CNT") {
                    this.evalExpression(forStmt.getIncr());
                    continue;
                } else {
                    throw Error(e.message);
                }
            }

        } while (true);
        this.env = previousEnv;
    }

    /**
     * The first insight of implementing this method is to throw an Error of type BreakStatementException
     * and then in visitWhileStatement(...) we will see if the catched error is instance of BreakStatementException
     * or Error by evaluating the constructor against the class, if the first is true will return normally,
     * if not we will re-throw the error. The problem appears when we tell tsc to target es3 which will
     * try to polyfill the inheretence mechanism. So our trick wouldn't work.
     * The solution? pass a string to Error and check that string up in visitWhileStatement(...).
     * @param breakStmt The break statement node.
     * @returns never
     */
    public visitBreakStatement(breakStmt: BreakStatement): never {
        throw Error("BRK");
    }

    public visitContinueStatement(continueStmt: ContinueStatement): never {
        throw Error("CNT");
    }

    // Private method (helpers):

    private convertToPencilBoolean(value: any): boolean {
        if (value === null || value === 0 || value === "" || value === "false") {
            return false;
        }
        if (typeof value === "boolean") {
            return value;
        }
        return true;
    }

    private checkOperator(operator: IToken, leftOperand: any, rightOperand?: any): boolean {
        if (rightOperand === undefined) {
            if (typeof leftOperand === "number" || typeof leftOperand === "boolean") {
                return true;
            }
            this.riseSemanticalError(operator, "Expected a number or boolean.");
            return false;
        } else {
            switch (operator.type) {
                case "PLUS":
                    if (typeof leftOperand === "number") {
                        if (typeof leftOperand === "number") {
                            return true;
                    }
                        }
                    if (typeof leftOperand === "string") {
                        if (typeof rightOperand === "number" || typeof rightOperand === "string") {
                            return true;
                        }
                    }
                    this.riseSemanticalError(operator, "Operands must be in a valid type to add them.");
                    return false;
                case "MINUS":
                    if (typeof leftOperand === "number" && typeof rightOperand === "number") {
                        return true;
                    }
                    this.riseSemanticalError(operator, "Operands must be numbers to subtract them.");
                    return false;
                case "STAR":
                    if (typeof leftOperand === "number" && typeof rightOperand === "number") {
                        return true;
                    }
                    this.riseSemanticalError(operator, "Operands must be numbers to multiply them.");
                case "SLASH":
                    if (typeof leftOperand === "number" && typeof rightOperand === "number") {
                        if (rightOperand === 0) {
                            this.riseSemanticalError(operator, "You can't divide by zero!");
                        }
                        return true;
                    }
                    this.riseSemanticalError(operator, "Operands must be numbers to divide them.");
                case "GREATER":
                case "GREATER_EQUAL":
                case "LESS":
                case "LESS_EQUAL":
                    if ((typeof leftOperand === "number" && typeof rightOperand === "number") ||
                        (typeof leftOperand === "boolean" && typeof rightOperand === "boolean") ||
                        (typeof leftOperand === "string" && typeof rightOperand === "string")) {
                        return true;
                    }
                    this.riseSemanticalError(operator, "Pencil doesn't allow implicit casting on equality operators.");
                    return false;
                case "EQUAL_EQUAL":
                case "BANG_EQUAL":
                    return true;
            }
            return false;
        }
    }
    // CUBRID RDBMS implementation of string escaping
    private _escapeString(val: any): any {
        if (typeof val !== "string") {
            return val;
        }

        val = val.replace(/[\0\n\r\b\t\\'"\x1a]/g, (s: string): string => {
            switch (s) {
                case "\0":
                return "\\0";
                case "\n":
                return "\\n";
                case "\r":
                return "\\r";
                case "\b":
                return "\\b";
                case "\t":
                return "\\t";
                case "\x1a":
                return "\\Z";
                case "'":
                return "''";
                case '"':
                return '""';
                default:
                return "\\" + s;
            }
        });
        return val;
      }

    private riseSemanticalError(token: IToken, message: string): never {
        throw Error(`At [:] >${message}`);
    }
}
