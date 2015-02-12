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

        constructor(input: string) {
            this.input = input;
            this.count = 0;
            this.curChar = this.readChar();
            //RegEx for token matching

        }

        // TODO: Create DFAs of the grammar provided in Alan's website
        // TODO: Write a reader for character by character code reading
        //       Read/String mode to separate string reading and token reading.

        // Convert User code into tokens
        public toTokens(): void {
            while(this.curChar != "") {
                this.lexerOut("Current Character " + this.curChar);
                this.curChar = this.readChar();
            }
        }

        // Read a single character and increment the counter
        public readChar(): string {
            return this.input.charAt(this.count++);
        }

        // Printing message into the log panel
        public lexerOut(msg: string): void {
            // format of the print string
            var icon = "<span class='glyphicon glyphicon-circle-arrow-right'></span>&nbsp";
            var printStr = "<div class='list-group-item list-group-item-info'>" + icon + msg + "</div>";

            // append the div to the log panel
            $("#log").append(printStr);
            this.scroll();
        }

        // Printing error message into the log panel
        public lexerErr(msg: string): void {
            var icon = "<span class='glyphicon glyphicon-remove-sign'></span>&nbsp";
            var errStr = "<div class='list-group-item list-group-item-danger'>" + icon + msg + "</div>";

            $("#log").append(errStr);
            this.scroll();
        }

        // Scroll the log to the bottom every time log updates
        public scroll(): void {
            $("#log").animate({
                scrollTop: $("#log")[0].scrollHeight
                }, 1000);
        }
    }
}
