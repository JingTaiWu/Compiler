/*
Token - Lexer reads the code character by character and converts words into Tokens using DFAs(or RegEx)
*/
var Compiler;
(function (Compiler) {
    var Token = (function () {
        function Token(name) {
            this.name = name;
        }
        return Token;
    })();
    Compiler.Token = Token;
})(Compiler || (Compiler = {}));
