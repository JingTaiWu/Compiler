/// <reference path="jquery.d.ts"/>

/*
    This Class manages the UI elements on the webpage
*/
module Compiler {
    export class Control {
        // Initializes UI elements
        public static init() {
            // Obtain the code from the text area and pass it into the Lexer
            var input = $("#codeInput").val();
            var Lexer = new Compiler.Lexer(input);
            Lexer.readChar();
        }
    }
}
