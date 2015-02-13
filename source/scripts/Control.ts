/// <reference path="jquery.d.ts"/>

/*
    This Class manages the UI elements on the webpage
*/
module Compiler {
    export class Control {
        // Initializes UI elements
        public static init() {
            // clear all the panels
            $("#log, #tokenTable > tbody:last").empty();
            // Obtain the code from the text area and pass it into the Lexer
            var input = $("#codeInput").val();
            LEXER = new Compiler.Lexer(input);
            if(LEXER.toTokens()) {
                this.displayToken(LEXER.getTokens());
            }
        }

        // For standard log output
        public static stdOut(src: string, msg: string): void {
            //var icon = "<span class='glyphicon glyphicon-circle-arrow-right'></span>&nbsp";
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var printStr = "<div class='list-group-item list-group-item-info'>" + label + msg + "</div>";

            $("#log").append(printStr);
            Control.scroll();
        }

        // For standard error output
        public static stdErr(src: string, msg: string): void {
            //var icon = "<span class='glyphicon glyphicon-remove-sign'></span>&nbsp";
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var errStr = "<div class='list-group-item list-group-item-danger'>" + label + msg + "</div>";

            $("#log").append(errStr);
            Control.scroll();
        }

        // For displaying all the tokens
        public static displayToken(src: Token[]): void {
            // Display all the tokens in the Tokens panel
            for(var j = 0; j < src.length; j++) {
                var token = src[j];
                var num = "<td>" + (j + 1) + "</td>";
                var name = "<td>" + token.getName() + "</td>";
                var value = "<td>" + token.getValue() + "</td>";
                var row = "<tr>" + num + name + value + "</tr>";
                // Append the row to the table
                $("#tokenTable > tbody:last").append(row);
                // Scroll
                $("#tokenPanel").animate({
                    scrollTop: $("#tokenPanel")[0].scrollHeight
                }, 200);
            }
        }

        // For log scrolling
        public static scroll(): void {
            $("#log").animate({
                scrollTop: $("#log")[0].scrollHeight
                }, 50);
        }
    }
}
