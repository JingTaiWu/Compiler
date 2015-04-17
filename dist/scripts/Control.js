/// <reference path="jquery.d.ts"/>
/// <reference path="globals.ts"/>
/// <reference path="Lexer.ts"/>
/// <reference path="SemanticAnalysis.ts"/>
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
            // clear all the panels
            $("#log, #tokenTable > tbody:last, #CSTDisplay, #ASTDisplay").empty();

            // Initialize state variables
            this.passLexer = false;
            this.passParser = false;

            // Obtain the code from the text area and pass it into the Lexer
            var input = $("#codeInput").val();
            LEXER = new Compiler.Lexer(input);

            try  {
                this.passLexer = LEXER.toTokens();
                this.stdNVOut("LEXER", "Lexer found no errors.");
                this.displayToken(LEXER.getTokens());
            } catch (e) {
                this.stdErr("LEXER", e);
            }

            if (this.passLexer) {
                try  {
                    PARSER = new Compiler.Parser(LEXER.getTokens());
                    this.passParser = PARSER.parse();
                    this.stdNVOut("PARSER", "Parser found no errors");
                    CST = PARSER.getCST();
                    this.displayTree(CST, "CST");
                } catch (e) {
                    this.stdErr("PARSER", e);
                }
            }

            if (this.passParser) {
                try  {
                    SEMANTIC_ANALYZER = new Compiler.SemanticAnalysis(PARSER.getCST());
                    AST = SEMANTIC_ANALYZER.getAST();
                    SEMANTIC_ANALYZER.createAST();
                    SEMANTIC_ANALYZER.createSymbolTable();
                    this.stdNVOut("SEMANTIC", "Semantic analyzer found no errors");
                    this.displayTree(SEMANTIC_ANALYZER.getAST(), "AST");
                } catch (e) {
                    this.stdErr("SEMANTIC_ANALYSIS", e);
                }
            }
        };

        // For standard log output
        Control.stdOut = function (src, msg) {
            if (!isVerbose) {
                return;
            }

            //var icon = "<span class='glyphicon glyphicon-circle-arrow-right'></span>&nbsp";
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var printStr = "<div class='list-group-item list-group-item-info'>" + label + msg + "</div>";

            $("#log").append(printStr);
            //Control.scroll();
        };

        // For standard error output
        Control.stdErr = function (src, msg) {
            //var icon = "<span class='glyphicon glyphicon-remove-sign'></span>&nbsp";
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var errStr = "<div class='list-group-item list-group-item-danger'>" + label + msg + "</div>";

            $("#log").append(errStr);
            Control.scroll();
        };

        // For non verbose output
        Control.stdNVOut = function (src, msg) {
            //var icon = "<span class='glyphicon glyphicon-circle-arrow-right'></span>&nbsp";
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var printStr = "<div class='list-group-item list-group-item-success'>" + label + msg + "</div>";

            $("#log").append(printStr);
            Control.scroll();
        };

        // For issuing warnings
        Control.stdWarn = function (src, msg) {
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var printStr = "<div class='list-group-item list-group-item-warning'>" + label + msg + "</div>";

            $("#log").append(printStr);
            Control.scroll();
        };

        // For displaying all the tokens
        Control.displayToken = function (src) {
            for (var j = 0; j < src.length; j++) {
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
        };

        // For tree display
        Control.displayTree = function (src, type) {
            var displayDiv = (type == "CST") ? "#CSTDisplay" : "#ASTDisplay";

            // clear the div first
            $(displayDiv).empty();

            // recursive function to traverse the tree
            function expand(node, depth) {
                for (var i = 0; i < depth; i++) {
                    var icon = "<span class='glyphicon glyphicon-minus'></span>";
                    $(displayDiv).append(icon);
                }

                if (node) {
                    var children = node.getChildren();
                }

                // If there are no children
                if (!children || children.length == 0) {
                    // append the name of the leaf node to the string
                    var label = "<span class='label label-success'>" + node.getName() + "</span>";
                    $(displayDiv).append(label + "<br>");
                } else {
                    var label = "<span class='label label-info'>" + node.getName() + "</span>";

                    // If there are children, expand each one
                    $(displayDiv).append(label + "<br>");
                    for (var j = 0; j < children.length; j++) {
                        expand(node.getChildren()[j], depth + 1);
                    }
                }
            }

            // Call the recursive function
            expand(src.getRootNode(), 0);
        };

        // For log scrolling
        Control.scroll = function () {
            $("#log").animate({
                scrollTop: $("#log")[0].scrollHeight
            }, 50);
        };
        return Control;
    })();
    Compiler.Control = Control;
})(Compiler || (Compiler = {}));
