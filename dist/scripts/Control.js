/// <reference path="jquery.d.ts"/>
/*
This Class manages the UI elements on the webpage
*/
var Compiler;
(function (Compiler) {
    var Control = (function () {
        function Control() {
        }
        // Initializes UI elements
        Control.init = function () {
            // Obtain the code from the text area and pass it into the Lexer
            var input = $("#codeInput").val();
            var Lexer = new Compiler.Lexer(input);
            Lexer.readChar();
        };
        return Control;
    })();
    Compiler.Control = Control;
})(Compiler || (Compiler = {}));
