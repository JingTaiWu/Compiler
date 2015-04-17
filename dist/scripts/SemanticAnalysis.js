/// <reference path="ConcreteSyntaxTree.ts"/>
/// <reference path="AbstractSyntaxTree.ts"/>
/// <reference path="Node.ts"/>
/// <reference path="SymbolTable.ts"/>
/*
Semantic Analysis - Third step of the compiler. After parsing is complete, a CST is passed to the
semantic analysis. Semantic analysis examines the CST and create an AST from it. It is also responsible
for scope checking and creating the symbol table.
*/
var Compiler;
(function (Compiler) {
    var SemanticAnalysis = (function () {
        function SemanticAnalysis(CST) {
            this.CST = CST;
            this.AST = new Compiler.AbstractSyntaxTree();
            this.SymbolTable = new Compiler.SymbolTable();
            this.AST.convert(this.CST.getRootNode());
            this.SymbolTable.create(this.AST.getRootNode());
        }
        SemanticAnalysis.prototype.getAST = function () {
            return this.AST;
        };
        return SemanticAnalysis;
    })();
    Compiler.SemanticAnalysis = SemanticAnalysis;
})(Compiler || (Compiler = {}));