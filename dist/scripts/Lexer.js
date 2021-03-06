/// <reference path="jquery.d.ts"/>
/// <reference path="Token.ts"/>
/// <reference path="Control.ts"/>
/*
Lexer/Scanner - First part of the compiler. Lexer reads the code character by character and creates token
*/
var Compiler;
(function (Compiler) {
    var Lexer = (function () {
        function Lexer(input) {
            // Replace /t with nothing
            this.input = input.trim();
            this.count = 0;
            this.stringMode = false;
            this.tokens = [];
        }
        // TODO: Create DFAs of the grammar provided in Alan's website
        // TODO: Write a reader for character by character code reading
        //       Read/String mode to separate string reading and token reading.
        // Convert User code into tokens, return null if it doesn't match
        Lexer.prototype.toTokens = function () {
            // Boolean for string mode
            var stringMode = false;

            // RegEx for delimiter
            // var DELIMITER = /([a-z]+)|(\d+)|(")|(==)|(!=)|(\S)/g;
            var DELIMITER = /([a-z]+)|(\d)|("[^"]*")|(==)|(!=)|(\S)/g;

            if (this.input == "") {
                throw "Please put some code in.";
            }

            if (this.input.charAt(this.input.length - 1) != "$") {
                this.stdWarn("Did not detect EOF at the end of the code, appending EOF.");
                this.input += "$";
            }

            this.stdOut("Processing the code...");

            // Separate the input line by line
            var lines = this.input.trim().split("\n");

            for (var lineNumber = 0; lineNumber < lines.length; lineNumber++) {
                // Get a line of code
                var line = lines[lineNumber];

                if (line) {
                    // Separate the line into words
                    var words = line.match(DELIMITER);
                    if (words) {
                        for (var i = 0; i < words.length; i++) {
                            var word = words[i];

                            //this.stdOut("Trying to match word: " + word);
                            var result = this.matchToken(word, lineNumber + 1);

                            // If there is a match, add it to the tokens list
                            if (result) {
                                if (result.getKind() == "STRING_TOKEN") {
                                    // If it is a string token, break it down to character tokens
                                    var str = result.getValue();
                                    for (var j = 0; j < str.length; j++) {
                                        var curChar = str[j];
                                        var character = /^[a-z]$/;
                                        if (curChar == "\"") {
                                            this.tokens.push(new Compiler.Token("QUOTATION_TOKEN", curChar, lineNumber + 1));
                                        } else if (curChar == " ") {
                                            this.tokens.push(new Compiler.Token("SPACE_TOKEN", curChar, lineNumber + 1));
                                        } else if (character.test(curChar)) {
                                            this.tokens.push(new Compiler.Token("CHARACTER_TOKEN", curChar, lineNumber + 1));
                                        } else {
                                            var errStr = "Invalid String Character: <strong>" + curChar + "</strong> on line <strong>" + (lineNumber + 1) + "</strong>.";
                                            throw errStr;
                                        }
                                    }
                                } else if (result.getKind() == "EOF_TOKEN") {
                                    this.tokens.push(result);

                                    // If the token is end of file and there are more things to come
                                    // issue a warning.
                                    if (lineNumber < lines.length - 1 || i < words.length - 1) {
                                        this.stdWarn("EOF Token detected and there are more code. The rest of the code will be ignored.");
                                    }
                                    return true;
                                } else {
                                    this.tokens.push(result);
                                }
                            } else {
                                // If not, throw an error
                                var errStr = "Invalid Token: <strong>" + word + "</strong> on line <strong>" + (lineNumber + 1) + "</strong>.";
                                throw errStr;
                            }
                        }
                    }
                }
            }

            Compiler.Control.stdNVOut("LEXER", "No LEX errors found.");
            return true;
        };

        // Match an input with Regexs in our grammar
        Lexer.prototype.matchToken = function (pattern, lineNumber) {
            // Type Tokens
            var type_int = /^int$/;
            var type_string = /^string$/;
            var type_boolean = /^boolean$/;

            // Identifier character
            var character = /^[a-z]$/;

            // Digit
            var digit = /^[0-9]$/;

            // Boolop
            var boolop = /^((==)|(!=))$/;

            // Boolval
            var boolval = /^((false)|(true))$/;

            // Intop
            var intop = /^\+$/;

            // Braces
            var openBrace = /^\{$/;
            var closeBrace = /^\}$/;

            // while, if, print
            var printKeyword = /^print$/;
            var whileKeyword = /^while$/;
            var ifKeyword = /^if$/;

            // assignment operator
            var assign = /^=$/;

            // parenthesis
            var openParent = /^\($/;
            var closeParent = /^\)$/;

            // EOF
            var EOF = /^\$$/;

            // String token
            var quotation = /"/;

            // Space token
            var space = /^\s$/;

            // match string token
            var str = /^("[^"]*")$/;

            // This is just going to be a big if statment
            // Ordered from the longest first
            if (type_boolean.test(pattern) || type_string.test(pattern) || type_int.test(pattern)) {
                return new Compiler.Token("TYPE_TOKEN", pattern, lineNumber);
            } else if (character.test(pattern)) {
                return new Compiler.Token("IDENTIFIER_TOKEN", pattern, lineNumber);
            } else if (digit.test(pattern)) {
                return new Compiler.Token("DIGIT_TOKEN", pattern, lineNumber);
            } else if (boolop.test(pattern)) {
                return new Compiler.Token("BOOL_OP_TOKEN", pattern, lineNumber);
            } else if (boolval.test(pattern)) {
                return new Compiler.Token("BOOL_VAL_TOKEN", pattern, lineNumber);
            } else if (intop.test(pattern)) {
                return new Compiler.Token("INT_OP_TOKEN", pattern, lineNumber);
            } else if (openBrace.test(pattern)) {
                return new Compiler.Token("OPEN_BRACE_TOKEN", pattern, lineNumber);
            } else if (closeBrace.test(pattern)) {
                return new Compiler.Token("CLOSE_BRACE_TOKEN", pattern, lineNumber);
            } else if (printKeyword.test(pattern)) {
                return new Compiler.Token("PRINT_KEYWORD_TOKEN", pattern, lineNumber);
            } else if (whileKeyword.test(pattern)) {
                return new Compiler.Token("WHILE_KEYWORD_TOKEN", pattern, lineNumber);
            } else if (ifKeyword.test(pattern)) {
                return new Compiler.Token("IF_KEYWORD_TOKEN", pattern, lineNumber);
            } else if (assign.test(pattern)) {
                return new Compiler.Token("ASSIGN_OP_TOKEN", pattern, lineNumber);
            } else if (openParent.test(pattern)) {
                return new Compiler.Token("OPEN_PARENTHESIS_TOKEN", pattern, lineNumber);
            } else if (closeParent.test(pattern)) {
                return new Compiler.Token("CLOSE_PARENTHESIS_TOKEN", pattern, lineNumber);
            } else if (EOF.test(pattern)) {
                return new Compiler.Token("EOF_TOKEN", pattern, lineNumber);
            } else if (space.test(pattern)) {
                return new Compiler.Token("SPACE_TOKEN", pattern, lineNumber);
            } else if (str.test(pattern)) {
                return new Compiler.Token("STRING_TOKEN", pattern, lineNumber);
            } else if (quotation.test(pattern)) {
                // If it discovers a quotation token, negate the stringmode
                this.stringMode = !this.stringMode;
                return new Compiler.Token("QUOTATION_TOKEN", pattern, lineNumber);
            } else {
                return null;
            }
        };

        // Matching characters in string mode
        // public matchChar(pattern: string, lineNumber: number): Token {
        //     var character = /^[a-z]$/;
        //     var quotation = /^"$/;
        //     // If the character is a quotation, negate the stringMode and add the quotation token
        //     if(quotation.test(pattern)) {
        //         this.stringMode = !this.stringMode;
        //         this.stdOut("Trying to match word: " + pattern);
        //         return new Token("QUOTATION_TOKEN", pattern, lineNumber);
        //     } else if(character.test(pattern)) {
        //         return new Token("CHARACTER_TOKEN", pattern, lineNumber);
        //     } else {
        //         return null;
        //     }
        // }
        Lexer.prototype.stdOut = function (msg) {
            Compiler.Control.stdOut("LEXER", msg);
        };

        Lexer.prototype.stdWarn = function (msg) {
            Compiler.Control.stdWarn("LEXER", msg);
        };

        Lexer.prototype.getTokens = function () {
            return this.tokens;
        };
        return Lexer;
    })();
    Compiler.Lexer = Lexer;
})(Compiler || (Compiler = {}));
