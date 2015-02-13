/// <reference path="jquery.d.ts"/>
/*
    Lexer - First part of the compiler. Lexer reads the code character by character and creates token 
*/
module Compiler {
    export class Lexer {
        // Class Variables
        private input: string;
        private count: number;
        private curChar: string;
        private curLineNumber: number;
        private buffer: string;
        private tokens: Compiler.Token[];

        constructor(input: string) {
            // Replace /t with nothing
            this.input = input.replace("/t", "");
            this.count = 0;
            this.curLineNumber = 0;
            this.curChar = "";
            this.buffer = "";
            this.tokens = [];
        }

        // TODO: Create DFAs of the grammar provided in Alan's website
        // TODO: Write a reader for character by character code reading
        //       Read/String mode to separate string reading and token reading.

        // Convert User code into tokens, return null if it doesn't match
        public toTokens(): void {
            // Space (as a separator)
            var space = /^(\s)|(\t)|(\n)$/;
            // Boolean for string mode
            var stringMode = false;

            // The Lexer reads the code character by character
            // It will only match patterns when it encounters a space
            // However, if it discovers a quotation mark, all the characters after the quotation
            // becomes a string token

            this.stdOut("processing the code...");

            for(var i = 0; i < this.input.length; i++) {
                this.curChar = this.input.charAt(i);
                // Add character to the buffer (except white spaces)
                if(!space.test(this.curChar)) {
                    this.buffer += this.curChar;
                }
                // Increment the line number if it is a new line character
                if(this.curChar == "\n") {this.curLineNumber++}
                // Test for quotation (enable/disable string mode if it is detected)
                if(this.curChar == "\"") {
                    // Create new token and add it to the token list
                    this.stdOut("Found a quotation!");
                    this.tokens.push(new Token("QUOTATION_TOKEN", this.curChar, this.curLineNumber));
                    stringMode = !stringMode;
                    this.buffer = "";
                } else if(stringMode) {
                    // If it is string mode, each character becomes a string token
                    this.stdOut("Adding Character string: " + this.buffer);
                    this.tokens.push(new Token("STRING_TOKEN", this.buffer, this.curLineNumber));
                    // Clear the buffer
                    this.buffer = "";                
                } else if((space.test(this.curChar) && this.buffer != "") || i == (this.input.length - 1)) {
                    // If it is a space and it is not in string mode, take the current buffer and start pattern matching
                    if(!stringMode) {
                        this.stdOut("Matching Word -> " + this.buffer);
                        var result = this.match(this.buffer);
                        if(result) {
                            // If there is a match, add it to the token list
                            this.tokens.push(result);
                            // clear the buffer
                            this.buffer = "";
                        } else {
                            // if not, throw an error
                            this.stdErr("Invalid Token: " + this.buffer + " at line " + this.curLineNumber + ".");
                            this.stdErr("TERMINATED.");
                            return;
                        }
                    }
                }
            }

            this.stdOut("EOF reached. No errors found.");
        }

        // Match an input with DFAs in our grammar
        public match(pattern: string): Token {
            // Type Tokens
            var type_int = /^int$/;
            var type_string = /^string$/;
            var type_boolean = /^boolean$/;
            // Char
            var character = /^[a-z]$/;
            // Digit
            var digit = /^[0-9]*$/;
            // Boolop
            var boolop = /^((==)|(!=))$/;
            // Boolval
            var boolval = /^((false)|(true))$/;
            // Intop
            var intop = /^\+$/;
            // Braces
            var brace = /^(\{|\})$/;
            // while, if, print
            var keyword = /^((print)|(while)|(if))$/;
            // assignment operator
            var assign = /^=$/;
            // parenthesis
            var parenthesis = /^(\(|\))$/;
            // EOF
            var EOF = /^\$$/;

            // This is just going to be a big if statment
            // Ordered from the longest first
            if(type_boolean.test(pattern) || type_string.test(pattern) || type_int.test(pattern)) {
                return new Token("TYPE_TOKEN", pattern, this.curLineNumber);
            } else if(character.test(pattern)) {
                return new Token("IDENTIFIER_TOKEN", pattern, this.curLineNumber);
            } else if(digit.test(pattern)) {
                return new Token("DIGIT_TOKEN", pattern, this.curLineNumber);
            } else if(boolop.test(pattern)) {
                return new Token("BOOL_OP_TOKEN", pattern, this.curLineNumber);
            } else if(boolval.test(pattern)) {
                return new Token("BOOL_VAL_TOKEN", pattern, this.curLineNumber);
            } else if(intop.test(pattern)) {
                return new Token("INT_OP_TOKEN", pattern, this.curLineNumber);
            } else if(brace.test(pattern)) {
                return new Token("BRACE_TOKEN", pattern, this.curLineNumber);
            } else if(keyword.test(pattern)) {
                return new Token("KEYWORD_TOKEN", pattern, this.curLineNumber);
            } else if(assign.test(pattern)) {
                return new Token("ASSIGN_OP_TOKEN", pattern, this.curLineNumber);
            } else if(parenthesis.test(pattern)) {
                return new Token("PARENTHESIS_TOKEN", pattern, this.curLineNumber);
            } else if(EOF.test(pattern)) {
                return new Token("EOF_TOKEN", pattern, this.curLineNumber);
            } else {
                return null;
            }
        }

        public stdOut(msg: string) {
            Control.stdOut("LEXER", msg);
        }

        public stdErr(msg: string) {
            Control.stdErr("LEXER", msg);
        }
    }
}
