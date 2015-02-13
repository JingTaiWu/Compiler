/*
Token - Lexer reads the code character by character and converts words into Tokens using DFAs(or RegEx)
*/
var Compiler;
(function (Compiler) {
    var Token = (function () {
        function Token(name, value, lineNumber) {
            this.name = name;
            this.value = value;
            this.lineNumber = lineNumber;
        }
        // Getters and Setters
        Token.prototype.getName = function () {
            return this.name;
        };

        Token.prototype.getValue = function () {
            return this.value;
        };

        Token.prototype.getLineNumber = function () {
            return this.lineNumber;
        };

        Token.prototype.setValue = function (newValue) {
            this.value = newValue;
        };

        Token.prototype.setLineNumber = function (newNumber) {
            this.lineNumber = newNumber;
        };
        return Token;
    })();
    Compiler.Token = Token;
})(Compiler || (Compiler = {}));
