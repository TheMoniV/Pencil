/*
* The very first implementation of Pencil interpreter.
* Hammadi Agharass - Alten 2018
* This file is under MIT license. 
* @File: Environment.ts
* @Description: This file contains all the needed implementation of Pencil environment.
*/

class Environment {
    private variables: Map<string, any>;
    private consts: Map<string, any>;
    private parent: Environment | undefined;

    public constructor(parent?: Environment) {
        this.variables = new Map<string, any>();
        this.consts = new Map<string, any>();
        this.parent = parent;
    }

    public defineVar(identifier: string, value: any): void {
        if (this.variables.get(identifier) === undefined) {
            this.variables.set(identifier, value);
            return;
        }
        throw Error(`"${identifier}" already defined.`);
    }

    public defineConst(identifier: string, value: any): void {
        if (this.consts.get(identifier) === undefined) {
            this.consts.set(identifier, value);
            return;
        }
        throw Error(`"${identifier}" already defined.`);
    }

    public getVar(identifier: string): any {
        if (this.variables.get(identifier) !== undefined) {
            return this.variables.get(identifier);
        }

        if (this.consts.get(identifier) !== undefined) {
            return this.consts.get(identifier);
        }

        if (this.parent !== undefined) {
            return this.parent.getVar(identifier);
        }
        throw Error(`Undefined variable "${identifier}".`);

    }

    public isThere(identifier: string): boolean {
        if (this.variables.get(identifier) !== undefined) {
            return true;
        }

        if (this.consts.get(identifier) !== undefined) {
            return true;
        }

        if (this.parent !== undefined) {
            return this.parent.isThere(identifier);
        }
        return false;

    }

    public assign(identifier: IToken, value: any): void {
        if (this.variables.get(identifier.token.toString()) !== undefined) {
            this.variables.set(identifier.token.toString(), value);
            return;
        }

        if (this.consts.get(identifier.token.toString()) !== undefined) {
            throw Error(`"${identifier.token}" is a constant!.`);
        }

        if (this.parent !== undefined) {
            return this.parent.assign(identifier, value);
        }

        throw Error(`"${identifier.token}" is undefined.`);
    }
}
