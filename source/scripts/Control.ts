/// <reference path="jquery.d.ts"/>

/*
    This Class manages the UI elements on the webpage
*/
module Compiler {
    export class Control {
        public static isVerbose: boolean;
        public static passLexer: boolean;
        public static passParser: boolean;
        // Initializes UI elements
        public static init() {
            // clear all the panels
            $("#log, #tokenTable > tbody:last").empty();
            // Initialize state variables
            this.isVerbose = true;
            this.passLexer = false;
            this.passParser = false;
            // Obtain the code from the text area and pass it into the Lexer
            var input = $("#codeInput").val();
            LEXER = new Compiler.Lexer(input);

            try {
                this.passLexer = LEXER.toTokens();
                this.stdNVOut("LEXER", "Lexer found no errors.");
                this.displayToken(LEXER.getTokens());
            } catch(e) {
                this.stdErr("LEXER", e);
            }

            if(this.passLexer) {
                try {
                    PARSER = new Compiler.Parser(LEXER.getTokens());
                    this.passParser = PARSER.parse();
                    this.stdNVOut("PARSER", "Parser found no errors");
                    CST = PARSER.getCST();
                    this.displayTree(PARSER.getCST());
                } catch(e) {
                    this.stdErr("PARSER", e);
                }
            }
        }

        // For standard log output
        public static stdOut(src: string, msg: string): void {
            if(!Control.isVerbose) {
                return;
            }
            //var icon = "<span class='glyphicon glyphicon-circle-arrow-right'></span>&nbsp";
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var printStr = "<div class='list-group-item list-group-item-info'>" + label + msg + "</div>";

            $("#log").append(printStr);
            //Control.scroll();
        }

        // For standard error output
        public static stdErr(src: string, msg: string): void {
            //var icon = "<span class='glyphicon glyphicon-remove-sign'></span>&nbsp";
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var errStr = "<div class='list-group-item list-group-item-danger'>" + label + msg + "</div>";

            $("#log").append(errStr);
            Control.scroll();
        }

        // For non verbose output
        public static stdNVOut(src: string, msg: string): void {
            //var icon = "<span class='glyphicon glyphicon-circle-arrow-right'></span>&nbsp";
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var printStr = "<div class='list-group-item list-group-item-success'>" + label + msg + "</div>";

            $("#log").append(printStr);
            Control.scroll();
        }

        // For issuing warnings
        public static stdWarn(src: string, msg: string): void {
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var printStr = "<div class='list-group-item list-group-item-warning'>" + label + msg + "</div>";

            $("#log").append(printStr);
            Control.scroll();
        }

        // For displaying all the tokens
        public static displayToken(src: Token[]): void {
            // Display all the tokens in the Tokens panel
            for(var j = 0; j < src.length; j++) {
                var token = src[j];
                var num = "<td>" + (j + 1) + "</td>";
                var name = "<td>" + token.getKind() + "</td>";
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

        // For tree display
        public static displayTree(src: Tree): void {
            // recursive function to traverse the tree
            function expand(node, depth) {
                // Add space to represent depth
                for(var i = 0; i < depth; i++) {
                    var icon = "<span class='glyphicon glyphicon-minus'></span>"
                    $("#CSTDisplay").append(icon);
                }

                var children = node.getChildren();
                // If there are no children
                if(!children || children.length == 0) {
                    // append the name of the leaf node to the string
                    var label = "<span class='label label-success'>" + node.getName() + "</span>";
                    $("#CSTDisplay").append(label + "<br>");
                } else {
                    var label = "<span class='label label-info'>" + node.getName() + "</span>";
                    // If there are children, expand each one
                    $("#CSTDisplay").append(label + "<br>");
                    for(var j = 0; j < children.length; j++) {
                        expand(node.getChildren()[j], depth + 1);
                    }
                }
            }

            // Call the recursive function
            expand(src.getRootNode(), 0);
        }

        // For log scrolling
        public static scroll(): void {
            $("#log").animate({
                scrollTop: $("#log")[0].scrollHeight
                }, 50);
        }
    }
}
