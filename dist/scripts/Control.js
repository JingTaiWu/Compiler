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
            // clear all the panels
            $("#log, #tokens").empty();

            // Obtain the code from the text area and pass it into the Lexer
            var input = $("#codeInput").val();
            LEXER = new Compiler.Lexer(input);
            LEXER.toTokens();
        };

        // For standard log output
        Control.stdOut = function (src, msg) {
            //var icon = "<span class='glyphicon glyphicon-circle-arrow-right'></span>&nbsp";
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var printStr = "<div class='list-group-item list-group-item-info'>" + label + msg + "</div>";

            $("#log").append(printStr);
            Control.scroll();
        };

        // For standard error output
        Control.stdErr = function (src, msg) {
            //var icon = "<span class='glyphicon glyphicon-remove-sign'></span>&nbsp";
            var label = "<span class='label label-default'>" + src + "</span>&nbsp ---- ";
            var errStr = "<div class='list-group-item list-group-item-danger'>" + label + msg + "</div>";

            $("#log").append(errStr);
            Control.scroll();
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
