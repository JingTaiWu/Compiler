/// <reference path="jquery.d.ts"/>
/// <reference path="Control.ts"/>
/*
    UIControl - controls div elements on the webpage
*/
$(document).ready(function(){
    // Initializes the compiler and begin compiling when the button is pressed
    $("#compile").click(function() {
        Compiler.Control.init();
    });
    // Turns verbose mode on and off by toggling the verbose button.
    $("#verboseBtn").click(function(){
        Compiler.Control.isVerbose = !Compiler.Control.isVerbose
        if(Compiler.Control.isVerbose) {
            $("#verboseBtn").text("Verbose On");
        } else {
            $("#verboseBtn").text("Verbose Off");
        }
    });
    // Example programs
    $("#example_1").click(function() {
        var codeStr = "{\n\tint a\n\ta = 0\n\tprint(a)\n}$"
        $("#codeInput").text(codeStr);
    });
    $("#example_2").click(function() {
        var codeStr = "{\n\tint a\n\ta = 1\n\t{\n\t\tint a\n\t\tprint(a)\n\t}\n\tstring b\n\t" + 
                      "b=\"alan\"\n\tif (a==1) {\n\t\tprint(b)\n\t}\n\tstring c\n\tc = \"james\"\n\t" + "b = \"blackstone\"\n\tprint(b)\n" +"}$";
        $("#codeInput").text(codeStr);
    });
    $("#example_3").click(function() {
        var codeStr = "{\n\tint a\n\tstring a\n\tboolean a\n}$"
        $("#codeInput").text(codeStr);
    });
    // $("#example_4").click(function() {
    //     var codeStr = "{\n\tint a = 0\n}$"
    //     $("#codeInput").text(codeStr);
    // });
});