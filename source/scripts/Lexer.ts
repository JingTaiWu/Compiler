/// <reference path="jquery.d.ts"/>
/*
    Lexer/Scanner - First part of the compiler. Lexer reads the code character by character and creates token 
*/
module Compiler {
    export class Lexer {
        // Class Variables
        private input: string;
        private count: number;
        private stringMode: boolean;
        private tokens: Compiler.Token[];

        constructor(input: string) {
            // Replace /t with nothing
            this.input = input;
            this.count = 0;
            this.stringMode = false;
            this.tokens = [];
        }

        // TODO: Create DFAs of the grammar provided in Alan's website
        // TODO: Write a reader for character by character code reading
        //       Read/String mode to separate string reading and token reading.

        // Convert User code into tokens, return null if it doesn't match
        public toTokens(): boolean {
            // Boolean for string mode
            var stringMode = false;
            // RegEx for delimiter
            var DELIMITER = /([a-z]+)|(\d+)|(")|(==)|(!=)|(\S)/g;
            // var DELIMITER = /([a-z]+)|(\d+)|("[^"]*")|(==)|(!=)|(\S)/g;

            if(this.input == "") {
                this.stdErr("Please put some code in.");
                return;
            }

            this.stdOut("Processing the code...");

            // Separate the input line by line
            var lines: string[] = this.input.trim().split("\n");

            for(var lineNumber = 0; lineNumber < lines.length; lineNumber++) {
                // Get a line of code
                var line = lines[lineNumber];

                if(line) {
                    // Separate the line into words
                    var words = line.match(DELIMITER);
                    if(words) {
                        for(var i = 0; i < words.length; i++) {
                            var word = words[i];
                            if(this.stringMode) {
                                for(var j = 0; j < word.length; j++) {
                                    var character = word[j];
                                    var characterToken = this.matchChar(character, lineNumber + 1);
                                    if(characterToken) {
                                        this.tokens.push(characterToken);
                                    } else {
                                        this.stdErr("Invalid string character: <strong>" + character + "</strong> on line <strong>" + (lineNumber + 1) + "</strong>.");
                                        this.stdErr("Terminated.");
                                        return false;
                                    }
                                }
                            } else {
                                this.stdOut("Trying to match word: " + word);
                                var result = this.matchToken(word, lineNumber + 1);

                                // If there is a match, add it to the tokens list
                                if(result) {
                                    this.tokens.push(result);
                                } else {
                                    // If not, throw an error
                                    this.stdErr("Invalid Token: <strong>" + word + "</strong> on line <strong>" + (lineNumber + 1) + "</strong>.");
                                    this.stdErr("Terminated.");
                                    return false;;
                                }                                
                            }
                        }
                    }
                }
            }

            this.stdOut("EOF reached. No errors found.");
            return true;
        }

        // Match an input with Regexs in our grammar
        public matchToken(pattern: string, lineNumber: number): Token {
            // Type Tokens
            var type_int = /^int$/;
            var type_string = /^string$/;
            var type_boolean = /^boolean$/;
            // Identifier character
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
            var printKeyword = /^print$/;
            var whileKeyword = /^while$/;
            var ifKeyword = /^if$/;
            // assignment operator
            var assign = /^=$/;
            // parenthesis
            var parenthesis = /^(\(|\))$/;
            // EOF
            var EOF = /^\$$/;
            // String token
            var quotation = /"/;

            // This is just going to be a big if statment
            // Ordered from the longest first
            if(type_boolean.test(pattern) || type_string.test(pattern) || type_int.test(pattern)) {
                return new Token("TYPE_TOKEN", pattern, lineNumber);
            } else if(quotation.test(pattern)) {
                // If it discovers a quotation token, negate the stringmode
                this.stringMode = !this.stringMode;
                return new Token("QUOTATION_TOKEN", pattern, lineNumber);
            } else if(character.test(pattern)) {
                return new Token("IDENTIFIER_TOKEN", pattern, lineNumber);
            } else if(digit.test(pattern)) {
                return new Token("DIGIT_TOKEN", pattern, lineNumber);
            } else if(boolop.test(pattern)) {
                return new Token("BOOL_OP_TOKEN", pattern, lineNumber);
            } else if(boolval.test(pattern)) {
                return new Token("BOOL_VAL_TOKEN", pattern, lineNumber);
            } else if(intop.test(pattern)) {
                return new Token("INT_OP_TOKEN", pattern, lineNumber);
            } else if(brace.test(pattern)) {
                return new Token("BRACE_TOKEN", pattern, lineNumber);
            } else if(printKeyword.test(pattern) || whileKeyword.test(pattern) || ifKeyword.test(pattern)) {
                return new Token("RESERVED_WORD_TOKEN", pattern, lineNumber);
            } else if(assign.test(pattern)) {
                return new Token("ASSIGN_OP_TOKEN", pattern, lineNumber);
            } else if(parenthesis.test(pattern)) {
                return new Token("PARENTHESIS_TOKEN", pattern, lineNumber);
            } else if(EOF.test(pattern)) {
                return new Token("EOF_TOKEN", pattern, lineNumber);
            } else {
                return null;
            }
        }

        // Matching characters in string mode
        public matchChar(pattern: string, lineNumber: number): Token {
            var character = /^[a-z]$/;
            var quotation = /^"$/;
            // If the character is a quotation, negate the stringMode and add the quotation token
            if(quotation.test(pattern)) {
                this.stringMode = !this.stringMode;
                this.stdOut("Trying to match word: " + pattern);
                return new Token("QUOTATION_TOKEN", pattern, lineNumber);
            } else if(character.test(pattern)) {
                return new Token("CHARACTER_TOKEN", pattern, lineNumber);
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

        public getTokens(): Token[] {
            return this.tokens;
        }
    }
}
