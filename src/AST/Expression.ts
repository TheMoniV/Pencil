/*
* The very first implementation of Pencil interpreter.
* Hammadi Agharass - Alten 2018
* This file is under MIT license. 
* @File: Expression.ts
* @Description: This file contains classes of all expressions of Pencil.
*/

/// <reference path="./Interfaces.ts" />

class AssignExpression implements Expression {
    private identifier: IToken;
    private expression: Expression;
    private ret: string;

    public constructor(identifier: IToken, expression: Expression, ret?: string) {
        this.identifier = identifier;
        this.expression = expression;
        this.ret = ret || "AFTER";
    }

    public getIdentifier(): IToken {
        return this.identifier;
    }

    public getExpression(): Expression {
        return this.expression;
    }

    public getReturnType(): string {
        return this.ret;
    }

    public accept(visitor: ExpressionVisitor): any {
        return visitor.visitAssignExpression(this);
    }
}

class Logical implements Expression {
    private left: Expression;
    private operator: IToken;
    private right: Expression;

    public constructor(left: Expression, operator: IToken, right: Expression) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    public getLeftOperand(): Expression {
        return this.left;
    }

    public getRightOperand(): Expression {
        return this.right;
    }

    public getOperator(): IToken {
        return this.operator;
    }

    public accept(visitor: ExpressionVisitor): any {
        return visitor.visitLogicalExpression(this);
    }
}

class TrinaryExpression implements Expression {
    private condition: Expression;
    private left: Expression;
    private right: Expression;

    public constructor(condition: Expression, left: Expression, right: Expression) {
        this.condition = condition;
        this.left = left;
        this.right = right;
    }

    public getLeftOperand(): Expression {
        return this.left;
    }

    public getRightOperand(): Expression {
        return this.right;
    }

    public getCondition(): Expression {
        return this.condition;
    }

    public accept(visitor: ExpressionVisitor): any {
        return visitor.visitTrinaryExpression(this);
    }
}

class BinaryExpression implements Expression {
    private left: Expression;
    private operator: IToken;
    private right: Expression;

    public constructor(left: Expression, op: IToken, right: Expression) {
        this.left = left;
        this.operator = op;
        this.right = right;
    }

    public getLeftOperand(): Expression {
        return this.left;
    }

    public getRightOperand(): Expression {
        return this.right;
    }

    public getOperator(): IToken {
        return this.operator;
    }

    public accept(visitor: ExpressionVisitor): any {
        return visitor.visitBinaryExpression(this);
    }
}

class UnaryExpression implements Expression {
    private operator: IToken;
    private right: Expression;

    public constructor(op: IToken, right: Expression) {
        this.operator = op;
        this.right = right;
    }

    public getRightOperand(): Expression {
        return this.right;
    }

    public getOperator(): IToken {
        return this.operator;
    }

    public accept(visitor: ExpressionVisitor): any {
        return visitor.visitUnaryExpression(this);
    }
}

class VariableExpression implements Expression {
    private identifier: IToken;

    public constructor(identifier: IToken) {
        this.identifier = identifier;
    }

    public getIdentifier(): IToken {
        return this.identifier;
    }

    public accept(visitor: ExpressionVisitor): any {
        return visitor.visitVariableExpression(this);
    }
}

class Literal implements Expression {
    private value: string | boolean | number | null;

    public constructor(value: string | boolean | number | null) {
        this.value = value;
    }

    public getValue(): string | boolean | number | null {
        return this.value;
    }

    public accept(visitor: ExpressionVisitor): any {
        return visitor.visitLiteral(this);
    }
}

class StringInterpolation implements Expression {
    private value: string;

    public constructor(value: string) {
        this.value = value;
    }

    public getValue(): string {
        return this.value;
    }

    public accept(visitor: ExpressionVisitor): string {
        return visitor.visitStringInterpolation(this);
    }
}

class GroupingExpression implements Expression {
    private expr: Expression;

    public constructor(expr: Expression) {
        this.expr = expr;
    }

    public accept(visitor: ExpressionVisitor): any {
        return visitor.visitGroupingExpression(this);
    }

    public getExpression(): Expression {
        return this.expr;
    }
}
