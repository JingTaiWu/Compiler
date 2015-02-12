/// <reference path="jquery.d.ts"/>
/*
    Lexer - First part of the compiler. Lexer reads the code character by character and creates token 
*/
module Compiler {
    export class Lexer {
        // Class Variables
        private input: string;

        constructor(input: string) {
            this.input = input;
        }

        // TODO: Create DFAs of the grammar provided in Alan's website
        // TODO: Write a reader for character by character code reading
        //       Read/String mode to separate string reading and token reading.

        // First Step: Read the input character by character
        public readChar(): void {
            for(var i = 0; i < this.input.length; i++) {
                this.lexerOut("The Current Character is " + this.input.charAt(i));
            }
        }

        // Printing message into the log panel
        public lexerOut(msg: string): void {
            // format of the print string
            var icon = "<span class='glyphicon glyphicon-circle-arrow-right'></span>&nbsp";
            var printStr = "<p>" + icon + msg + "</p>";

            // append the div to the log panel
            $("#log").append(printStr);
        }

        // Printing error message into the log panel
        public lexerErr(msg: string): void {

        }
    }
}
