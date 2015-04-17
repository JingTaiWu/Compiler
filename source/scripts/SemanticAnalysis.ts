/// <reference path="ConcreteSyntaxTree.ts"/>
/// <reference path="AbstractSyntaxTree.ts"/>
/// <reference path="Node.ts"/>
/// <reference path="SymbolTable.ts"/>
/*
    Semantic Analysis - Third step of the compiler. After parsing is complete, a CST is passed to the
    semantic analysis. Semantic analysis examines the CST and create an AST from it. It is also responsible
    for scope checking and creating the symbol table.
*/
module Compiler {
    export class SemanticAnalysis {
        private CST: ConcreteSyntaxTree;
        private AST: AbstractSyntaxTree;
        private SymbolTable: SymbolTable;
        constructor(CST: ConcreteSyntaxTree) {
            this.CST = CST;
        }

        public getAST(): AbstractSyntaxTree {
            return this.AST;
        }

        public createAST(): void {
            this.AST = new AbstractSyntaxTree();
            this.AST.convert(this.CST.getRootNode());
        }

        public createSymbolTable(): void {
            this.SymbolTable = new SymbolTable();
            this.SymbolTable.create(this.AST.getRootNode());
        }
    }
}
