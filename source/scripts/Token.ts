/*
    Token - Lexer reads the code character by character and converts words into Tokens using DFAs(or RegEx)
*/
module Compiler {
    export class Token {
        private name: string;
        constructor(name: string) {
            this.name = name;
        }
    }
}
