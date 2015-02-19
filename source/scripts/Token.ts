/*
    Token - Lexer reads the code character by character and converts words into Tokens using DFAs(or RegEx)
*/
module Compiler {
    export class Token {
        // Properties of Token
        // name - The name of the token
        private kind: string;
        // value -  The value of the input
        private value: string;
        // lineNumber - The line number in which the token was found
        private lineNumber: number;
        constructor(kind: string, value: string, lineNumber: number) {
            this.kind = kind;
            this.value = value;
            this.lineNumber = lineNumber;
        }

        // Getters and Setters
        public getKind(): string {
            return this.kind;
        }

        public getValue(): string {
            return this.value;
        }

        public getLineNumber(): number {
            return this.lineNumber;
        }

        public setValue(newValue: string): void {
            this.value = newValue;
        }

        public setLineNumber(newNumber: number): void {
            this.lineNumber = newNumber;
        }
    }
}
